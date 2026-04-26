import 'dart:async';
import 'package:flutter/foundation.dart';
import '../providers/auth_provider.dart';
import '../services/access_control_layer.dart';
import '../services/startup_guard_service.dart';
import '../services/startup_policy_engine.dart';
import '../services/system_health_service.dart';

class AppAccessController extends ChangeNotifier {
  final StartupResult startupResult;
  final AccessControlLayer _accessControl;
  final SystemHealthMonitor _monitor;
  final SystemHealthCache _cache;
  final SystemHealthEvaluator _evaluator;
  AllowedCapabilities _capabilities = const AllowedCapabilities(
    allowLogin: false,
    allowPOS: false,
    allowDashboard: false,
  );

  String _lastSignature = '';
  bool _refreshing = false;
  SystemHealthSnapshot _lastSnapshot = SystemHealthSnapshot.initial();
  bool _hasAuthSession = false;
  bool _hasManagerRole = false;
  String? _storeId;
  Timer? _ttlTimer;

  AppAccessController({
    required this.startupResult,
    AccessControlLayer? accessControl,
    SystemHealthMonitor? monitor,
    SystemHealthCache? cache,
    SystemHealthEvaluator? evaluator,
  })  : _accessControl = accessControl ?? AccessControlLayer(),
        _monitor = monitor ?? SystemHealthMonitor(),
        _cache = cache ?? SystemHealthCache(),
        _evaluator = evaluator ?? const SystemHealthEvaluator() {
    _ttlTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      if (_cache.isExpired) {
        _refreshFromCurrentContext(force: true);
      }
    });
  }

  AllowedCapabilities get capabilities => _capabilities;
  bool get isOfflineSafeMode =>
      !_lastSnapshot.inventoryRpcOk || !_lastSnapshot.supabaseConnectivityOk;
  bool get shouldShowWarningBanner =>
      _evaluator.shouldShowWarningBanner(_lastSnapshot);
  SystemHealthSnapshot get healthSnapshot => _lastSnapshot;

  bool canLogin() => _capabilities.allowLogin;
  bool canAccessPOS() => _capabilities.allowPOS;
  bool canAccessDashboard() => _capabilities.allowDashboard;

  void updateFromAuth(AuthProvider auth) {
    final signature = [
      auth.status.name,
      auth.appUser?.role ?? '',
      auth.appUser?.storeId ?? '',
      auth.supabaseAccessToken != null ? '1' : '0',
    ].join('|');
    _hasAuthSession = auth.supabaseAccessToken != null;
    _hasManagerRole = auth.isManager;
    _storeId = auth.appUser?.storeId;
    if (_refreshing || signature == _lastSignature) return;
    _lastSignature = signature;
    _refresh(auth, force: true); // auth state change must refresh immediately.
  }

  Future<void> manualRefresh(AuthProvider auth) async {
    await _refresh(auth, force: true);
  }

  Future<void> _refresh(AuthProvider auth, {bool force = false}) async {
    _hasAuthSession = auth.supabaseAccessToken != null;
    _hasManagerRole = auth.isManager;
    _storeId = auth.appUser?.storeId;
    await _refreshFromCurrentContext(force: force);
  }

  Future<void> _refreshFromCurrentContext({bool force = false}) async {
    _refreshing = true;
    try {
      SystemHealthSnapshot snapshot;
      if (!force && !_cache.isExpired && _cache.hasUsableSnapshot) {
        snapshot = _cache.bestEffortSnapshot();
      } else {
        try {
          snapshot = await _monitor.detect(
            hasAuthSession: _hasAuthSession,
            storeId: _storeId,
            checkDashboard: _hasManagerRole,
          );
          _cache.store(snapshot);
        } catch (_) {
          // fallback to cached state for temporary failures
          snapshot = _cache.bestEffortSnapshot();
        }
      }

      _lastSnapshot = snapshot;
      final resolved = _accessControl.resolveCapabilities(
        startupResult,
        hasAuthSession: _hasAuthSession,
        hasManagerRole: _hasManagerRole,
        storeId: _storeId,
        snapshot: snapshot,
      );
      _capabilities = resolved;
      notifyListeners();
    } finally {
      _refreshing = false;
    }
  }

  @override
  void dispose() {
    _ttlTimer?.cancel();
    super.dispose();
  }
}
