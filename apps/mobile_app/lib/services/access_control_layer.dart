import 'startup_guard_service.dart';
import 'startup_policy_engine.dart';
import 'system_health_service.dart';

class AccessControlLayer {
  final StartupPolicyEngine _policyEngine;
  final SystemHealthEvaluator _healthEvaluator;

  AccessControlLayer({
    StartupPolicyEngine? policyEngine,
    SystemHealthEvaluator? healthEvaluator,
  })  : _policyEngine = policyEngine ?? StartupPolicyEngine(),
        _healthEvaluator = healthEvaluator ?? const SystemHealthEvaluator();

  AllowedCapabilities resolveCapabilities(
    StartupResult startupResult, {
    required bool hasAuthSession,
    required bool hasManagerRole,
    required String? storeId,
    required SystemHealthSnapshot snapshot,
  }) {
    final hasValidStoreId = _isUuid(storeId);
    final posOperational = _healthEvaluator.isPosOperational(
      snapshot,
      hasValidStoreId: hasValidStoreId,
    );
    final dashboardOperational = _healthEvaluator.isDashboardOperational(
      snapshot,
      hasValidStoreId: hasValidStoreId,
      hasManagerRole: hasManagerRole,
    );

    return _policyEngine.evaluate(
      startupResult,
      snapshot,
      hasAuthSession: hasAuthSession,
      hasManagerRole: hasManagerRole,
      posOperational: posOperational,
      dashboardOperational: dashboardOperational,
    );
  }

  bool _isUuid(String? value) {
    if (value == null) return false;
    final uuidRegex = RegExp(
      r'^[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[1-5][0-9a-fA-F]{3}\-[89abAB][0-9a-fA-F]{3}\-[0-9a-fA-F]{12}$',
    );
    return uuidRegex.hasMatch(value);
  }
}
