import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/app_user.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Auth status enum
// ─────────────────────────────────────────────────────────────────────────────

/// Describes the current authentication + role resolution state.
enum AuthStatus {
  /// Supabase session is being checked / user profile is being fetched.
  loading,

  /// No active Supabase session — show the login screen.
  unauthenticated,

  /// Signed in and role resolved as cashier.
  cashier,

  /// Signed in and role resolved as manager or admin.
  manager,
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthProvider
// ─────────────────────────────────────────────────────────────────────────────

/// Central authentication state for the Lucky Store POS application.
///
/// Responsibilities:
/// - Maps staff PINs to local roles for fast login.
/// - For manager/admin PINs, also performs a real Supabase signInWithPassword
///   in the background so that a valid JWT is available for Edge Function calls
///   (e.g. import-inventory) that require server-side authorization.
/// - Exposes [appUser], [status], [isManager], [isCashier] to the widget tree.
/// - Provides [signInWithPin] and [signOut] helpers.
///
/// Register in `MultiProvider` **before** any screen that consumes it.
class AuthProvider extends ChangeNotifier {
  // ── PIN Constants ────────────────────────────────────────────────────────────
  static const String pinManager = '1947';
  static const String pinCashier = '2026';
  static const String pinAdmin   = '8888';

  // ── Internal Supabase client ─────────────────────────────────────────────────
  static final SupabaseClient _supabase = Supabase.instance.client;

  // ── Public state ────────────────────────────────────────────────────────────

  AuthStatus _status = AuthStatus.unauthenticated;
  AuthStatus get status => _status;

  AppUser? _appUser;
  AppUser? get appUser => _appUser;

  bool get isManager => _appUser?.isManager == true;
  bool get isCashier => _appUser?.isCashier == true;

  /// Exposes the current Supabase access token (null if not signed in or
  /// the user is a local-only cashier session without a Supabase account).
  String? get supabaseAccessToken =>
      _supabase.auth.currentSession?.accessToken;

  // Optional sign-in error message for the login screen to display.
  String? _signInError;
  String? get signInError => _signInError;

  // ─── Constructor ────────────────────────────────────────────────────────────

  AuthProvider() {
    _init();
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  void _init() {
    // No persistence — start fresh on every app launch.
    _status = AuthStatus.unauthenticated;
  }

  void _setStatus(AuthStatus s) {
    if (_status == s) return;
    _status = s;
    notifyListeners();
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /// Sign in with a staff PIN.
  ///
  /// For **cashier** PINs a lightweight local-only session is created.
  /// For **manager / admin** PINs the method also performs a real
  /// `signInWithPassword` against Supabase Auth (using service-account
  /// credentials stored in `.env`) so that a valid Bearer JWT is available
  /// for Edge Function calls such as `import-inventory`.
  Future<bool> signInWithPin(String pin) async {
    _signInError = null;
    _setStatus(AuthStatus.loading);

    // Small delay to feel premium/authentic.
    await Future.delayed(const Duration(milliseconds: 500));

    String? role;
    if (pin == pinManager) {
      role = 'manager';
    } else if (pin == pinCashier) {
      role = 'cashier';
    } else if (pin == pinAdmin) {
      role = 'admin';
    }

    if (role == null) {
      _signInError = 'Invalid PIN. Please try again.';
      _setStatus(AuthStatus.unauthenticated);
      return false;
    }

    // ── Cashier: local-only session (no Supabase JWT needed) ──────────────────
    if (role == 'cashier') {
      _appUser = AppUser(
        id: 'local-cashier',
        authId: 'local-auth-id',
        name: 'CASHIER',
        role: 'cashier',
        storeId: dotenv.maybeGet('DEFAULT_STORE_ID') ?? '4acf0fb2-f831-4205-b9f8-e1e8b4e6e8fd',
      );
      _setStatus(AuthStatus.cashier);
      return true;
    }

    // ── Manager / Admin: obtain a real Supabase session ───────────────────────
    try {
      final email = role == 'manager'
          ? (dotenv.maybeGet('MANAGER_EMAIL') ?? '')
          : (dotenv.maybeGet('ADMIN_EMAIL') ?? '');
      final password = role == 'manager'
          ? (dotenv.maybeGet('MANAGER_PASSWORD') ?? '')
          : (dotenv.maybeGet('ADMIN_PASSWORD') ?? '');

      if (email.isEmpty || password.isEmpty) {
        debugPrint('[AuthProvider] Service-account credentials not configured '
            'in .env for role=$role. Falling back to local session.');
        // Graceful fallback: allow local session but warn — import will fail.
        _appUser = AppUser(
          id: 'local-$role',
          authId: 'local-auth-id',
          name: role.toUpperCase(),
          role: role,
          storeId: dotenv.maybeGet('DEFAULT_STORE_ID') ?? '4acf0fb2-f831-4205-b9f8-e1e8b4e6e8fd',
        );
        _setStatus(AuthStatus.manager);
        return true;
      }

      // Sign into Supabase — this sets session so supabaseAccessToken is valid.
      final authResponse = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (authResponse.user == null) {
        throw Exception('Supabase sign-in returned no user');
      }

      // Hydrate AppUser from the real public.users row.
      final profile = await _supabase
          .from('users')
          .select('id, auth_id, full_name, role, store_id')
          .eq('auth_id', authResponse.user!.id)
          .maybeSingle();

      if (profile != null) {
        _appUser = AppUser.fromJson(profile);
      } else {
        // Fallback if the public.users row is missing.
        _appUser = AppUser(
          id: authResponse.user!.id,
          authId: authResponse.user!.id,
          name: role.toUpperCase(),
          role: role,
          storeId: dotenv.maybeGet('DEFAULT_STORE_ID') ?? '4acf0fb2-f831-4205-b9f8-e1e8b4e6e8fd',
        );
      }

      _setStatus(AuthStatus.manager);
      debugPrint('[AuthProvider] Manager/Admin signed in — '
          'JWT obtained, user=${_appUser?.name}, role=${_appUser?.role}');
      return true;
    } catch (e) {
      debugPrint('[AuthProvider] Supabase sign-in failed: $e');
      _signInError = 'Service login failed. Check network and try again.';
      _setStatus(AuthStatus.unauthenticated);
      return false;
    }
  }

  /// Sign the current user out and reset state.
  Future<void> signOut() async {
    try {
      // Sign out of Supabase if a real session exists.
      if (_supabase.auth.currentSession != null) {
        await _supabase.auth.signOut();
      }
    } catch (e) {
      debugPrint('[AuthProvider] signOut error: $e');
    }
    _appUser = null;
    _setStatus(AuthStatus.unauthenticated);
  }

  /// Clear any previously stored sign-in error message.
  void clearSignInError() {
    if (_signInError != null) {
      _signInError = null;
      notifyListeners();
    }
  }
}
