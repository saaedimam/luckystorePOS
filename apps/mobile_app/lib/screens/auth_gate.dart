import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../controllers/app_access_controller.dart';
import '../providers/auth_provider.dart';
import '../providers/pos_provider.dart';
import '../services/startup_guard_service.dart';
import 'staff_pin_login_screen.dart';
import 'manager/manager_shell.dart';
import 'pos/pos_main_screen.dart';

/// Root routing widget that reacts to [AuthProvider.status] and sends
/// the user to the correct screen with zero manual navigation calls.
///
/// Placement: set as `home:` in MaterialApp so it is always the base.
class AuthGate extends StatelessWidget {
  final StartupResult startupResult;

  const AuthGate({
    super.key,
    required this.startupResult,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer2<AuthProvider, AppAccessController>(
      builder: (context, auth, access, _) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (context.mounted) {
            context.read<PosProvider>().setOfflineSafeMode(access.isOfflineSafeMode);
          }
        });
        final child = switch (auth.status) {
          // ── Loading: PIN validation in progress ───────────────────────────
          AuthStatus.loading => const _SplashScreen(),

          // ── No session: show PIN keypad ───────────────────────────────────
          AuthStatus.unauthenticated => access.canLogin()
              ? const StaffPinLoginScreen()
              : const _CapabilityBlockedScreen(
                  title: 'Login Disabled',
                  message: 'Runtime health policy is currently blocking login.',
                ),

          // ── Cashier: go straight to POS ───────────────────────────────────
          AuthStatus.cashier => access.canAccessPOS()
              ? const PosMainScreen()
              : const _CapabilityBlockedScreen(
                  title: 'POS Restricted',
                  message: 'POS is currently unavailable due to runtime health.',
                ),

          // ── Manager / Admin: full management shell ────────────────────────
          AuthStatus.manager => access.canAccessDashboard()
              ? const ManagerShell()
              : const _CapabilityBlockedScreen(
                  title: 'Dashboard Restricted',
                  message:
                      'Dashboard is currently unavailable due to runtime health.',
                ),
        };

        if (!access.shouldShowWarningBanner) return child;
        return _WarningFrame(child: child);
      },
    );
  }
}

class _WarningFrame extends StatelessWidget {
  final Widget child;
  const _WarningFrame({required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          color: const Color(0xFF8A5A00),
          child: const Text(
            'DEGRADED HEALTH: Cached mode active while connectivity recovers.',
            style: TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Expanded(child: child),
      ],
    );
  }
}

class _CapabilityBlockedScreen extends StatelessWidget {
  final String title;
  final String message;

  const _CapabilityBlockedScreen({
    required this.title,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFF161B22),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white12),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.policy_outlined, color: Colors.orangeAccent),
                  const SizedBox(height: 10),
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    message,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Splash / loading screen
// ─────────────────────────────────────────────────────────────────────────────

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFF0D1117),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Gold store icon
            _StoreLogo(),
            SizedBox(height: 32),
            CircularProgressIndicator(
              color: Color(0xFFE8B84B),
              strokeWidth: 2.5,
            ),
          ],
        ),
      ),
    );
  }
}

class _StoreLogo extends StatelessWidget {
  const _StoreLogo();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE8B84B), Color(0xFFD4941A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE8B84B).withValues(alpha: 0.35),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: const Icon(Icons.store_rounded, color: Colors.white, size: 42),
    );
  }
}
