import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/pos_models.dart';
import '../models/app_user.dart';

/// PosProvider manages the active POS session, cart, and sale operations.
/// Register in MultiProvider before any POS screen is accessed.
class PosProvider extends ChangeNotifier {
  final _supabase = Supabase.instance.client;

  // ── Session ────────────────────────────────────────────────────────────────
  PosSession? _session;
  PosSession? get session => _session;
  bool get hasActiveSession => _session != null;

  String? _cashierId;
  String? _cashierName;
  String? _storeId;
  String? get cashierId   => _cashierId;
  String? get cashierName => _cashierName;
  String? get storeId     => _storeId;

  // ── Cart ───────────────────────────────────────────────────────────────────
  final List<CartItem> _cart = [];
  List<CartItem> get cart => List.unmodifiable(_cart);
  bool get cartIsEmpty => _cart.isEmpty;

  double _cartDiscount = 0; // sale-level discount in ৳
  double get cartDiscount => _cartDiscount;

  double get subtotal => _cart.fold(0, (sum, c) => sum + c.lineTotal);
  double get totalAmount => (subtotal - _cartDiscount).clamp(0, double.infinity);
  int get itemCount => _cart.fold(0, (sum, c) => sum + c.qty);

  // ── Payment methods ────────────────────────────────────────────────────────
  List<PaymentMethod> _paymentMethods = [];
  List<PaymentMethod> get paymentMethods => _paymentMethods;

  // ── Loading / error ────────────────────────────────────────────────────────
  bool _loading = false;
  bool get loading => _loading;

  String? _error;
  String? get error => _error;

  void _setLoading(bool v) { _loading = v; notifyListeners(); }
  void _setError(String? e) { _error = e; notifyListeners(); }
  void clearError() { _error = null; notifyListeners(); }

  // ── Session management ─────────────────────────────────────────────────────

  /// Load cashier profile by auth user. Returns true if found.
  Future<bool> loadCashierProfile() async {
    try {
      final authId = _supabase.auth.currentUser?.id;
      if (authId == null) return false;

      final row = await _supabase
          .from('users')
          .select('id, full_name, role, store_id')
          .eq('auth_id', authId)
          .single();

      _cashierId   = row['id']       as String;
      _cashierName = row['full_name']     as String? ?? 'Cashier';
      _storeId     = row['store_id'] as String?;
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Could not load user profile: $e');
      return false;
    }
  }

  /// Hydrate cashier state directly from an [AppUser] that was already resolved
  /// by [AuthProvider] — eliminates the extra Supabase round-trip from
  /// [loadCashierProfile] when [StaffPinLoginScreen] is used post-login.
  Future<void> loadFromAppUser(AppUser user) async {
    _cashierId   = user.id;
    _cashierName = user.name;
    _storeId     = user.storeId;
    notifyListeners();
    await _loadPaymentMethods();
  }

  /// Open a POS shift session. Must be called before completing any sale.
  Future<bool> openSession({double openingCash = 0}) async {
    if (_cashierId == null || _storeId == null) return false;
    _setLoading(true);
    try {
      final row = await _supabase
          .from('pos_sessions')
          .insert({
            'store_id':    _storeId,
            'cashier_id':  _cashierId,
            'status':      'open',
            'opening_cash': openingCash,
          })
          .select()
          .single();

      _session = PosSession.fromJson(row);
      await _loadPaymentMethods();
      _setLoading(false);
      return true;
    } catch (e) {
      _setLoading(false);
      _setError('Failed to open session: $e');
      return false;
    }
  }

  Future<void> _loadPaymentMethods() async {
    if (_storeId == null) return;
    try {
      final rows = await _supabase
          .from('payment_methods')
          .select()
          .eq('store_id', _storeId!)
          .eq('is_active', true)
          .order('sort_order');
      _paymentMethods = (rows as List)
          .map((r) => PaymentMethod.fromJson(r as Map<String, dynamic>))
          .toList();
      notifyListeners();
    } catch (_) {}
  }

  // ── Cart operations ────────────────────────────────────────────────────────

  void addItem(PosItem item, {int qty = 1}) {
    final idx = _cart.indexWhere((c) => c.item.id == item.id);
    if (idx >= 0) {
      _cart[idx].qty += qty;
    } else {
      _cart.add(CartItem(item: item, qty: qty));
    }
    notifyListeners();
  }

  void removeItem(String itemId) {
    _cart.removeWhere((c) => c.item.id == itemId);
    notifyListeners();
  }

  void setQty(String itemId, int qty) {
    if (qty <= 0) { removeItem(itemId); return; }
    final idx = _cart.indexWhere((c) => c.item.id == itemId);
    if (idx >= 0) { _cart[idx].qty = qty; notifyListeners(); }
  }

  void setLineDiscount(String itemId, double discount) {
    final idx = _cart.indexWhere((c) => c.item.id == itemId);
    if (idx >= 0) { _cart[idx].discount = discount; notifyListeners(); }
  }

  void setCartDiscount(double amount) {
    _cartDiscount = amount.clamp(0, subtotal);
    notifyListeners();
  }

  void clearCart() {
    _cart.clear();
    _cartDiscount = 0;
    notifyListeners();
  }

  // ── Complete sale ──────────────────────────────────────────────────────────

  Future<SaleResult> completeSale(List<PaymentTender> tenders) async {
    if (_cart.isEmpty) throw Exception('Cart is empty');
    if (_cashierId == null || _storeId == null) throw Exception('No active session');

    final itemsPayload = _cart.map((c) => {
      'item_id':    c.item.id,
      'qty':        c.qty,
      'unit_price': c.item.price,
      'cost':       c.item.cost,
      'discount':   c.discount,
    }).toList();

    final paymentsPayload = tenders.map((t) => {
      'payment_method_id': t.method.id,
      'amount':            t.amount,
      'reference':         t.reference,
    }).toList();

    final result = await _supabase.rpc('complete_sale', params: {
      'p_store_id':   _storeId,
      'p_cashier_id': _cashierId,
      'p_session_id': _session?.id,
      'p_items':      itemsPayload,
      'p_payments':   paymentsPayload,
      'p_discount':   _cartDiscount,
    });

    // Capture items for receipt before clearing cart
    final itemsForReceipt = List<CartItem>.from(_cart);
    final sale = SaleResult.fromJson(result as Map<String, dynamic>, items: itemsForReceipt);
    
    clearCart();
    return sale;
  }

  // ── Void sale ──────────────────────────────────────────────────────────────

  Future<void> voidSale(String saleId, String reason) async {
    await _supabase.rpc('void_sale', params: {
      'p_sale_id': saleId,
      'p_reason':  reason,
    });
  }

  // ── Scan / search ──────────────────────────────────────────────────────────

  Future<PosItem?> scanItem(String value) async {
    if (_storeId == null) return null;
    final result = await _supabase.rpc('lookup_item_by_scan', params: {
      'p_scan_value': value,
      'p_store_id':   _storeId,
    });
    if (result == null) return null;
    return PosItem.fromJson(result as Map<String, dynamic>);
  }

  Future<List<PosItem>> searchItems(String query, {String? categoryId}) async {
    if (_storeId == null) return [];
    final result = await _supabase.rpc('search_items_pos', params: {
      'p_store_id':    _storeId,
      'p_query':       query,
      'p_category_id': categoryId,
      'p_limit':       60,
      'p_offset':      0,
    });
    if (result == null) return [];
    return (result as List)
        .map((r) => PosItem.fromJson(r as Map<String, dynamic>))
        .toList();
  }

  Future<List<PosCategory>> loadCategories() async {
    if (_storeId == null) return [];
    final result = await _supabase.rpc('get_pos_categories', params: {
      'p_store_id': _storeId,
    });
    if (result == null) return [];
    return (result as List)
        .map((r) => PosCategory.fromJson(r as Map<String, dynamic>))
        .toList();
  }
}
