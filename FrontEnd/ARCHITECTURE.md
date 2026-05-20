# React + TypeScript Scalable Architecture

This document outlines the strict, scalable enterprise-level architecture used in the **AI Study Hub** frontend. All future developments must adhere to these structural and coding guidelines.

## 📦 Core Technologies

- **Framework**: React 19 + TypeScript + Vite
- **Global State**: Zustand (for UI state, auth state, and theme)
- **Server State**: React Query (TanStack Query) for data fetching, caching, and mutations
- **Forms & Validation**: React Hook Form + Zod
- **Styling**: TailwindCSS (v4)
- **HTTP Client**: Axios (with centralized interceptors)
- **Routing**: React Router DOM (v7)

## 📂 Folder Structure

The project strictly follows a **Feature-Based Architecture** (screaming architecture) to ensure scalability, modularity, and maintainability.

```text
src/
├── app/                  # Application-wide configurations (Router, App context providers)
├── assets/               # Static assets (images, global SVGs, fonts)
├── components/           # Shared, reusable global components
│   ├── ui/               # Dumb components (Button, Input, Modal, Card)
│   └── layout/           # Layout wrappers (DashboardLayout, Sidebar, Navbar)
├── config/               # Environment variables, global constants, dev toggles
├── features/             # Feature modules (Domain-driven)
│   ├── admin/            # Admin dashboard & user management
│   ├── ai-chatbot/       # AI conversational interface & contextual queries
│   ├── auth/             # Authentication (Login, Register, OAuth, Tokens)
│   ├── dashboard/        # Main user dashboard & analytics
│   ├── documents/        # File uploads, cloud storage, vault management
│   └── quizzes/          # AI generated quizzes and results
├── hooks/                # Global reusable React hooks (e.g., useDebounce, useMediaQuery)
├── lib/                  # Third-party library configurations (Axios instances, utility wrappers)
├── stores/               # Global Zustand stores (authStore, uiStore)
├── types/                # Global TypeScript definitions & API types
├── utils/                # Pure helper functions (formatDate, string manipulators)
├── main.tsx              # App Entry Point
└── index.css             # Global Tailwind imports & CSS variables
```

### Anatomy of a Feature (`src/features/*`)
Each feature folder acts as a self-contained module. Cross-feature imports should be minimized.

```text
src/features/auth/
├── components/           # Components specific to auth (LoginForm, SocialButtons)
├── hooks/                # Hooks containing business logic (useLogin, useRegister)
├── pages/                # Page-level components used directly by React Router
├── schemas/              # Zod schemas for form validation (loginSchema)
└── services/             # API calls (authService.ts) using the Axios instance
```

## 🛠️ Best Practices & SOLID Principles

### 1. Separation of Concerns (Business Logic vs. UI)
- **Never** write `fetch` or complex API logic directly inside a `.tsx` UI component.
- Extract API calls into `services/` (e.g., `authService.login`).
- Extract React Query mutations/queries into `hooks/` (e.g., `useLogin`).
- The UI component (`LoginForm.tsx`) should only handle presentation and wiring up the hook.

### 2. Form Handling
- Always use **React Hook Form** for performance (prevents unnecessary re-renders).
- Always use **Zod** for schema-based validation. Define schemas in the `schemas/` folder.

### 3. State Management (Zustand vs React Query)
- **React Query**: Use for any data that comes from the backend (documents, user profile, chat history). It handles caching, loading states, and error retries out-of-the-box.
- **Zustand**: Use *only* for client-side global state that the backend doesn't care about (e.g., isSidebarOpen, activeTheme, JWT token storage).

### 4. API & Error Handling
- Use the centralized `apiClient` (Axios instance) located in `src/lib/axios.ts` or similar.
- Rely on Axios interceptors to attach `Bearer` tokens automatically and handle `401 Unauthorized` token refreshes or logouts globally.
- Error handling should be graceful. Hooks should return standard error structures that components can render as Toast notifications or inline alerts.

### 5. Security & Authorization
- **Protected Routes**: Wrap routes that require login with `<ProtectedRoute>`.
- **Role-Based Access**: Wrap routes that require specific roles (e.g., Admin) with `<RoleRoute allowedRoles={['admin']}>`.

### 6. Clean Imports
- Always use absolute imports with the `@/` alias (e.g., `import { Button } from '@/components/ui/Button'`) rather than relative paths (`../../components/ui/Button`).

## 💻 Example Code Structure

**1. Service (`authService.ts`)**
```typescript
import { apiClient } from '@/lib/apiClient';

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data;
  }
}
```

**2. Custom Hook (`useLogin.ts`)**
```typescript
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useAuthStore } from '@/stores/authStore';

export function useLogin() {
  const setSession = useAuthStore(s => s.setSession);
  
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setSession(data.user, data.tokens);
    }
  });
}
```

**3. UI Component (`LoginForm.tsx`)**
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLogin } from '../hooks/useLogin';
import { loginSchema } from '../schemas/loginSchema';

export function LoginForm() {
  const loginMutation = useLogin();
  const form = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values) => loginMutation.mutate(values);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Input fields */}
      <Button disabled={loginMutation.isPending}>
        {loginMutation.isPending ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
```
