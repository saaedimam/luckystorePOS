import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'theme/app_theme.dart';
import 'screens/auth_gate.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/pos_provider.dart';
import 'screens/checkout/checkout_screen.dart';
import 'screens/checkout/bkash_checkout.dart';
import 'screens/checkout/gamified_reward_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: ".env");

  await Supabase.initialize(
    url: dotenv.env['SUPABASE_URL']!,
    anonKey: dotenv.env['SUPABASE_ANON_KEY']!,
  );

  runApp(
    MultiProvider(
      providers: [
        // AuthProvider must be first — other providers may depend on its state.
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => AppLocaleNotifier()),
        ChangeNotifierProvider(create: (_) => PosProvider()),
      ],
      child: const LuckyStoreApp(),
    ),
  );
}

class AppLocaleNotifier extends ChangeNotifier {
  Locale? _locale;
  Locale? get locale => _locale;

  void setLocale(Locale locale) {
    if (!L10n.all.contains(locale)) return;
    _locale = locale;
    notifyListeners();
  }
}

class L10n {
  static final all = [
    const Locale('en'),
    const Locale('bn'),
  ];
}

class LuckyStoreApp extends StatelessWidget {
  const LuckyStoreApp({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppLocaleNotifier>(context);

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Lucky Store',
      theme: AppTheme.darkTheme,

      // Localization setup
      locale: provider.locale,
      supportedLocales: L10n.all,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],

      // Dynamic OS language detection
      localeResolutionCallback: (locale, supportedLocales) {
        if (locale == null) return supportedLocales.first;
        for (var supportedLocale in supportedLocales) {
          if (supportedLocale.languageCode == locale.languageCode) {
            return supportedLocale;
          }
        }
        return supportedLocales.first;
      },

      // AuthGate is the new root — it dispatches based on role.
      home: const AuthGate(),

      // Named routes used within POS / checkout flows only.
      routes: {
        '/checkout':       (_) => const CheckoutScreen(),
        '/bkash-checkout': (_) => BkashCheckoutScreen(
          bkashUrl: 'https://checkout.sandbox.bKash.com/placeholder',
          paymentId: 'PENDING_PAYMENT_ID',
          amount: 0,
        ),
        '/order-confirmed': (_) => const GamifiedRewardScreen(),
      },
    );
  }
}
