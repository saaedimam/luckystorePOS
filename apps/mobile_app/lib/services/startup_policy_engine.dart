import 'startup_guard_service.dart';
import 'system_health_service.dart';

class AllowedCapabilities {
  final bool allowLogin;
  final bool allowPOS;
  final bool allowDashboard;

  const AllowedCapabilities({
    required this.allowLogin,
    required this.allowPOS,
    required this.allowDashboard,
  });
}

class StartupPolicyEngine {
  AllowedCapabilities evaluate(
    StartupResult startupResult,
    SystemHealthSnapshot health, {
    required bool hasAuthSession,
    required bool hasManagerRole,
    required bool posOperational,
    required bool dashboardOperational,
  }) {
    if (startupResult.state == StartupState.blocked) {
      return const AllowedCapabilities(
        allowLogin: false,
        allowPOS: false,
        allowDashboard: false,
      );
    }

    // Startup policy no longer depends on credential-env completeness.
    // Authentication can proceed and credential failures are surfaced by AuthProvider.
    if (!hasAuthSession) {
      return const AllowedCapabilities(
        allowLogin: true,
        allowPOS: false,
        allowDashboard: false,
      );
    }

    final runtimeHealthy = health.supabaseConnectivityOk && health.authSessionValid;
    final posHealthy = runtimeHealthy && posOperational;
    final dashboardHealthy = runtimeHealthy && dashboardOperational;

    if (hasManagerRole) {
      return AllowedCapabilities(
        allowLogin: true,
        allowPOS: posHealthy,
        allowDashboard: dashboardHealthy,
      );
    }

    // Cashier-authenticated path.
    return AllowedCapabilities(
      allowLogin: true,
      allowPOS: posHealthy,
      allowDashboard: false,
    );
  }
}
