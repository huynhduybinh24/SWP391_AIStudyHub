# AI Study Hub — Frontend Architecture

Enterprise-grade React + TypeScript (Vite) structure aligned with the Figma dashboard design.

## Recommended packages (installed)

| Package | Purpose |
|---------|---------|
| `react-router-dom` | Routing, protected & role-based routes |
| `@tanstack/react-query` | Server/API state, caching, loading & errors |
| `zustand` | Global client state (auth, UI) |
| `react-hook-form` + `@hookform/resolvers` + `zod` | Forms & validation |
| `axios` | HTTP client with interceptors |
| `tailwindcss` + `@tailwindcss/vite` | Styling (Figma tokens) |
| `lucide-react` | Icons |
| `recharts` | Weekly activity chart |
| `clsx` + `tailwind-merge` | Conditional class names |

## Folder structure

```
src/
├── app/                    # Application shell
│   ├── providers/          # React Query, Router providers
│   └── router/             # routes, ProtectedRoute, RoleRoute
├── components/
│   ├── ui/                 # Reusable primitives (Button, Card, Input…)
│   ├── layout/             # Sidebar, Header, Footer, DashboardLayout
│   └── feedback/           # LoadingOverlay, ErrorState
├── config/                 # env, navigation constants
├── features/               # Feature modules (vertical slices)
│   ├── auth/               # Login, session, auth service
│   ├── dashboard/          # Figma dashboard screen
│   ├── documents/          # Document management
│   ├── quizzes/            # Quizzes
│   ├── ai-chatbot/         # AI chat
│   └── admin/              # Admin dashboard (role-gated)
├── hooks/                  # Shared hooks (useAsyncQuery)
├── lib/                    # axios, queryClient, utils
├── stores/                 # Zustand stores
└── types/                  # Shared TypeScript types
```

### Per-feature module layout

Each feature under `features/<name>/` follows:

```
features/<name>/
├── api/           # Optional: thin API wrappers
├── components/    # UI only — no business rules
├── hooks/         # React Query / custom hooks (business orchestration)
├── pages/         # Route entry components
├── schemas/       # Zod schemas (forms)
├── services/      # Business logic & API calls
└── types/         # Feature-specific types
```

| Folder | Responsibility |
|--------|----------------|
| `app/` | Bootstraps providers and routing; no feature logic |
| `components/ui/` | Design-system primitives; stateless, reusable |
| `components/layout/` | App chrome matching Figma (sidebar, header) |
| `features/*/services/` | API + domain logic (testable without React) |
| `features/*/hooks/` | Connect services to UI via React Query |
| `features/*/pages/` | Compose components for a route |
| `lib/axios.ts` | Auth header injection, 401 logout |
| `stores/` | Cross-cutting client state (auth session, UI) |

## Import alias

`@/` → `src/` (configured in `vite.config.ts` and `tsconfig.json`).

## Auth & authorization

- **Protected routes**: `ProtectedRoute` redirects unauthenticated users to `/login`.
- **Role routes**: `RoleRoute` restricts paths (e.g. `/admin` → `admin` only).
- **Demo accounts**:
  - `alex@example.com` / `password` → student
  - `admin@example.com` / `password` → admin

## Figma implementation

Dashboard (`node-id=5-7285`) is implemented in `features/dashboard/`:

- Sidebar navigation, header search & user menu
- Welcome banner, quick actions, storage ring
- Recent documents, Quick Ask AI, weekly chart, alerts
- FAB → AI Chatbot

Design tokens: primary `#2563eb`, surface `#f8f9ff`, foreground `#0b1c30`.

## Best practices

1. **SOLID**: Services are single-purpose; UI components depend on hooks, not axios directly.
2. **No duplication**: Shared UI in `components/ui`, shared query wrapper in `hooks/useAsyncQuery`.
3. **Separation**: Pages compose; hooks fetch; services call API.
4. **Errors**: `ApiError` + React Query `isError` + `ErrorState` component.
5. **Loading**: Query `isLoading` + `LoadingOverlay`.
6. **Forms**: `react-hook-form` + Zod resolver (see `LoginForm`).

## Scripts

```bash
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## Environment

Copy `.env.example` → `.env` and set `VITE_API_BASE_URL`.
