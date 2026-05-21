# React Vibe Coding Patterns — Lucky Store POS

This guide outlines core web client development practices for the `admin_web` and storefront services.

## 🧱 Architectural Stack

*   **Core Logic:** React (Functional Components + hooks only).
*   **State Management:** `Zustand` with optional persistence middleware.
*   **Data Fetching / Mutations:** `TanStack Query (React Query)` for server state cache management.
*   **Styling:** Vanilla CSS (curated design tokens, harmony HSL colors, modern variables).

---

## ⚡ Core Rules & Invariants

### 1. Functional Components & Hooks First
*   Zero class components.
*   Extract complex UI states or side effects into custom hooks (`useCart`, `useCheckout`).
*   Always use strict types: no `any` is allowed. Define exact props/state shapes.

### 2. Zustand for UI Orchestration
*   Use Zustand for transient, client-side, global UI states (e.g., current active tab, shopping cart item list, drawer toggle states).
*   Avoid mixing global UI state with server-queried data. Let React Query manage server state.

```typescript
import { create } from 'zustand';

interface POSState {
  activeRegisterId: string | null;
  setActiveRegister: (id: string) => void;
}

export const usePOSStore = create<POSState>((set) => ({
  activeRegisterId: null,
  setActiveRegister: (id) => set({ activeRegisterId: id }),
}));
```

### 3. Server Interaction via React Query + Supabase SDK
*   Never run raw async fetches inside `useEffect`. Wrap database RPC calls inside `useQuery` or `useMutation` hooks.
*   Always handle query error and loading boundaries.
*   Trigger optimistic updates for instant UI feedback (such as updating order quantities or adding catalog tags).

### 4. Rich Aesthetics & Modern UI Controls
*   Always leverage modern, harmonic color tokens. No basic `red`, `blue`, or `green`.
*   Incorporate micro-animations and smooth CSS transitions (`transition: all 0.2s ease-in-out`).
*   Structure tables, overlays, and modals cleanly using modern CSS variables.

---

## 🚀 Verification
Validate typings and build integrity using:
```bash
cd apps/admin_web && npm run typecheck && npm run build
```
