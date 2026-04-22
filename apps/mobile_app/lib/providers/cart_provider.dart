import 'package:flutter/foundation.dart';

class CartItem {
  final String sku;
  final String name;
  final double price;
  int quantity;

  CartItem({required this.sku, required this.name, required this.price, this.quantity = 1});
}

class CartProvider extends ChangeNotifier {
  final Map<String, CartItem> _items = {};

  Map<String, CartItem> get items => _items;

  int get itemCount => _items.values.fold(0, (sum, item) => sum + item.quantity);

  double get totalAmount => _items.values.fold(0.0, (sum, item) => sum + (item.price * item.quantity));

  void addItem(String sku, String name, double price) {
    if (_items.containsKey(sku)) {
      _items[sku]!.quantity += 1;
    } else {
      _items[sku] = CartItem(sku: sku, name: name, price: price);
    }
    notifyListeners();
  }

  void removeItem(String sku) {
    _items.remove(sku);
    notifyListeners();
  }

  void decrementItem(String sku) {
    if (!_items.containsKey(sku)) return;
    if (_items[sku]!.quantity > 1) {
      _items[sku]!.quantity -= 1;
    } else {
      _items.remove(sku);
    }
    notifyListeners();
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }
}
