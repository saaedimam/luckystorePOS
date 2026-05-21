# Flutter Vibe Coding Patterns — Lucky Store POS

This guide outlines the core development patterns and architectural rules for the Flutter mobile app under the `luckystorePOS` ecosystem.

## 🧱 Architectural Stack

*   **State Management:** `Riverpod` (using code generation via `riverpod_generator`).
*   **Database / Offline Cache:** `Drift` (SQLite) with reactive streams.
*   **Data Models:** `freezed` for immutable value objects and union types.
*   **Networking:** `dio` paired with Supabase RPC layer.

---

## ⚡ Core Rules & Invariants

### 1. Riverpod Generator First
*   Always use `@riverpod` or `@Riverpod(keepAlive: true)` annotations.
*   Avoid legacy `StateNotifierProvider` or custom manual provider definitions.
*   Keep logic side-effect free in providers unless mutating state.

```dart
@riverpod
class CartController extends _$CartController {
  @override
  CartState build() => const CartState.empty();

  void addItem(Product product) {
    // Immutable update pattern
  }
}
```

### 2. Drift Local Database as Source of Truth
*   The UI must listen to Drift query streams (`watch()`) rather than fetching directly from Supabase.
*   Background workers sync Supabase changes to Drift, which auto-updates the UI.
*   All offline mutations must be written to an append-only transaction ledger in Drift before pushing to Supabase.

### 3. Immutable Value Objects (`freezed`)
*   Never write standard mutable classes for data transfer or state objects.
*   Always leverage `@freezed` to generate complete value equality, copyWith, and serialization support.

```dart
@freezed
class Product with _$Product {
  const factory Product({
    required String id,
    required String name,
    required double price,
    required int stockLevel,
  }) = _Product;

  factory Product.fromJson(Map<String, dynamic> json) => _$ProductFromJson(json);
}
```

### 4. Robust Error Handling & Empty States
*   Always present clear empty states when list lengths are zero.
*   Map all Riverpod `AsyncValue` errors gracefully using `when` patterns:
```dart
asyncValue.when(
  data: (data) => _buildContent(data),
  error: (error, stackTrace) => ErrorWidget(error),
  loading: () => const ShimmerLoader(),
);
```

---

## 🚀 Verification
Run the Flutter analyzer after any changes to verify type safety and layout rules:
```bash
cd apps/mobile_app && flutter analyze
```
