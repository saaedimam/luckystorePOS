# Flutter POS Technical Audit — Lucky Store

Date: 2026-04-24
Scope audited: `apps/mobile_app`

## A. Executive Summary
This codebase is **not ready for scaled, high-reliability retail POS operations** in its current state. It has strong UI ambition and some solid backend-offloaded transaction intent (RPC-based `complete_sale`), but the architecture is inconsistent (two app paradigms mixed), core security decisions are unsafe for production (hardcoded staff PINs plus manager/admin credentials loaded into client runtime), and operational resilience is thin (no local cart/session crash recovery, weak hardware-failure handling, no robust retry/circuit breaking, and little evidence of production test coverage). It can run pilot operations with tight controls, but scaling to multi-store, high-throughput retail would likely produce downtime, data integrity incidents, and expensive support burden.

## B. Scorecard (1–10)
- Code Quality: **4/10**
- Architecture: **4/10**
- Maintainability: **3/10**
- Performance: **5/10**
- Scalability: **3/10**
- POS Reliability: **3/10**
- Security: **2/10**
- Release Readiness: **2/10**

## C. Concrete Findings

### 1) Code Quality
- **God screens and oversized UI files**: several UI files exceed sustainable size (`pos_main_screen.dart` ~1000 LOC, `payment_screen.dart` ~900 LOC, `inventory_import_screen.dart` ~500 LOC), which blocks unit testability and encourages hidden coupling.
- **Dead/legacy parallel app flows**: legacy e-commerce scaffold and cart stack (`MainScaffold`, `CartProvider`, checkout widgets) coexist with new POS flow and are still wired into app startup providers/routes, increasing cognitive load and regression risk.
- **Route inconsistency bug**: checkout navigates to `'/ssl-checkout'` but that route is not registered in `MaterialApp.routes`; this is a runtime navigation failure path.
- **Linting is default-only**: project only includes `flutter_lints` baseline with no stricter custom rules; this is insufficient for a cash-handling POS domain.
- **Error handling quality is uneven**: several services swallow errors silently (`catch (_) {}` or comments “Log error”) and return null/false without diagnostics, making incident root-cause analysis hard.
- **Logging**: mostly `debugPrint` strings, no structured logging with correlation IDs/receipt IDs/session IDs for production support.

### 2) Architecture
- **State management split-brain**: app uses Provider, but with two cart domains (`CartProvider` and POS cart inside `PosProvider`) and two UX paradigms (consumer checkout vs POS), indicating architecture drift.
- **Separation of concerns is weak**: UI screens directly call Supabase and business operations instead of going through repositories/use-cases (e.g., dashboard/session summary).
- **Dependency injection is minimal**: services/providers construct dependencies internally (`Supabase.instance.client`) with no injectable abstraction for tests.
- **Routing design is fragmented**: root `AuthGate` is role-based, but old named routes remain active and inconsistent with current production path.
- **Feature modularity**: code is grouped by coarse folders (`screens`, `providers`, `services`) rather than feature modules with explicit boundaries (e.g., `features/pos`, `features/auth`, `features/inventory_import`).

### 3) Scalability
- **Multi-store tenancy assumptions are brittle**: cashier path can start local-only sessions using a default store id fallback; there is no explicit tenant-scoped guardrail in client logic.
- **Large catalog support is limited client-side**: `search_items_pos` is always called with `limit=60` and `offset=0` (no paging state), so browse/search UX at scale will degrade.
- **Offline-first is effectively absent**: no local persistence for cart/session drafts or queued transactions.
- **Hardware instability handling is not production-grade**: Bluetooth printing and label printing are explicitly disabled/throwing exceptions.
- **Retry strategy**: mostly one-shot requests; inventory import has polling but no exponential backoff/jitter policy.

### 4) POS Reliability
- **Session startup reliability gap**: login proceeds even when POS session init fails (“non-fatal”), allowing operator to continue toward sale flow with undefined session state.
- **Potential session atomicity concerns**: `completeSale` passes nullable session id (`p_session_id: _session?.id`) and only checks cashier/store IDs; depends entirely on backend to reject invalid session linkage.
- **No crash recovery mid-sale**: cart and payment tender state are in-memory only.
- **Receipt reprint is partial**: only immediate post-sale `ReceiptScreen` has print/share; no explicit historical receipt reprint workflow surfaced in manager/cashier flows.
- **Shift close fallback bypass**: if close-session RPC fails, client directly updates table status via fallback update query; this can bypass richer server validations.

### 5) Security
- **Critical auth anti-pattern**: hardcoded staff PINs in client source for manager/cashier/admin roles.
- **Privileged credentials in client runtime path**: manager/admin email/password from `.env` are used by mobile client for `signInWithPassword`; this is not acceptable for hardened production POS.
- **Secrets packaging risk**: `.env` is included as a Flutter asset, meaning all included keys ship with app bundle.
- **Client-side role assumptions**: role resolution and local fallback sessions can allow privileged UI access even if backend auth path is degraded.

### 6) Build/Release Readiness
- **Android release signing is debug**: release build explicitly uses debug signing config.
- **No flavors/env matrix**: no clear staging/production flavor separation or environment contract.
- **Test readiness is poor**: only default Flutter counter test exists and is not representative of this app.
- **Plugin risk unresolved**: printing/Bluetooth dependencies are declared but key runtime functions are disabled, indicating unresolved platform integration risk at release time.

## D. Highest-Risk Technical Debt (Top 10)
1. Hardcoded PIN-based role auth in client.
2. Manager/admin credential usage from client `.env` runtime.
3. `.env` shipped in Flutter assets.
4. No offline cart/session persistence or crash recovery.
5. Debug-signed Android release config.
6. Disabled Bluetooth/thermal printer pathways despite POS dependency.
7. Mixed legacy + POS app architectures in one runtime.
8. Missing route (`/ssl-checkout`) causing runtime payment path failure.
9. Inconsistent server-validation bypass fallbacks (session close direct update).
10. Near-zero meaningful automated test coverage.

## E. Refactor Roadmap

### Immediate (this week)
- Remove hardcoded PINs and credential-based manager login from client; replace with server-issued short-lived staff auth flow.
- Stop bundling `.env` secrets into app assets; split public vs secret config.
- Fix broken route map and remove dead checkout path from production nav.
- Block sale completion when no verified open session exists, with user-visible recovery flow.
- Replace debug release signing config with proper release signing.

### Near term (30 days)
- Introduce feature-first modular architecture and repository/use-case layers.
- Unify to one cart domain (POS) and isolate/remove legacy e-commerce flow.
- Implement structured telemetry/logging (device id, store id, session id, sale id).
- Add local persistence for in-progress cart, tenders, and unsynced transactions.
- Implement robust retry/backoff wrappers for network and hardware operations.

### Growth stage (90+ days)
- Add offline transaction queue with idempotency keys and conflict resolution.
- Introduce tenant-aware configuration and store bootstrap contracts.
- Build hardware abstraction layer with health probes and failover printer profiles.
- Add comprehensive test pyramid: unit, widget, integration, and end-to-end sale lifecycle tests.
- Add CI/CD with static analysis gates, secret scanning, dependency scanning, and release promotion workflow.

## F. If I Were CTO
I would **freeze non-essential features immediately**, remediate authentication/security and release hygiene first, and then do a **targeted partial rewrite** around architecture boundaries (auth, POS transaction orchestration, hardware integration, offline engine). I would not scale this codebase to multiple stores until the top risks above are addressed and verified in pilot stores with observability and rollback playbooks.
