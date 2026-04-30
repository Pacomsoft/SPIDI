# SPIDI Front-React — Copilot Instructions

## Project Overview

SPIDI is a **Next.js 15 App Router** admin system for managing delivery drivers at HEB Mexico. It uses a **Hexagonal Architecture (Ports & Adapters) + DDD** pattern strictly enforced across all modules.

---

## Commands

```bash
npm run dev      # Next.js dev server with HTTPS (--experimental-https)
npm run build    # Production build
npm run start    # Production start (binds to 127.0.0.1, behind nginx reverse proxy)
npm run lint     # ESLint
```

---

## Architecture

### Module Structure

Every feature lives in `modules/<name>/` with three layers:

```
modules/<name>/
├── domain/
│   ├── contracts/          # Interfaces: repositories, services, DTOs, use-case signatures
│   ├── entities/           # Domain entities (plain classes, no external deps)
│   ├── value-objects/      # Immutable value objects
│   └── errors/             # Domain-specific error classes
├── application/
│   ├── use-cases/          # Business logic (IUseCase<TInput, TOutput>)
│   ├── hooks/              # React hooks (DI via props/params, no direct imports from infra)
│   └── presentation/
│       ├── views/          # Page-level composition (view.tsx)
│       ├── components/     # Feature components (index.tsx + style.module.scss)
│       └── ui/             # shadcn wrappers: re-export only (never import directly from @/components/ui)
└── infrastructure/
    ├── services/           # Concrete implementations of domain service interfaces
    ├── repositories/       # Concrete implementations of domain repository interfaces
    └── dependency-injection.ts  # Composition root — only place that wires deps
```

### Key Modules

| Module | Purpose |
|--------|---------|
| `modules/login/` | Authentication: PKCE OAuth with Microsoft Entra ID + SPIDI backend exchange |
| `modules/adm/` | Admin layout, sidebar, session info, module access guards |
| `modules/shared/` | Cross-cutting: HTTP client, token repo, session repo, IndexedDB, nonce |
| `modules/denied/` | Access denied page |

### Shared Module Contracts

- `IUseCase<TInput, TOutput>` — all use cases implement this interface
- `ITokenRepository` — IndexedDB-backed token storage
- `ISessionRepository` — IndexedDB-backed session storage
- `FetchHttpClient` — general HTTP client (native `fetch`, handles auth headers, token refresh, ETag, idempotency)

---

## Authentication Flow (PKCE — no next-auth)

1. `InitiateLoginUseCase` → `EntraPkceAuthService.initiateRedirect()` — generates PKCE verifier/challenge, redirects to Microsoft
2. Microsoft → `/validate-token?code=XXX&state=YYY`
3. `useExchangeCode` hook — exchanges code with Microsoft via axios, stores `ms_access_token` in sessionStorage, redirects to `/auth/spidi-token`
4. `useGetSpidiToken` hook — reads MS token from sessionStorage, calls `ValidateTokenUseCase`
5. `ValidateTokenUseCase` → `SpidiEntraAuthService.authenticateWithEntraToken()` — POST to SPIDI backend, then GET `/api/v1/authorization/me`
6. Session saved to IndexedDB → redirect to role-based home page

**No `client_secret`** — PKCE is a public client flow. All auth env vars are `NEXT_PUBLIC_`.

**Key files:**
- `modules/login/infrastructure/services/entra-pkce-auth.service.ts` — PKCE core
- `modules/login/application/hooks/use-exchange-code.hook.ts` — `/validate-token` callback
- `modules/login/application/hooks/use-get-spidi-token.hook.ts` — `/auth/spidi-token` exchange
- `lib/auth.ts` — `authProvider` singleton (logout, isAuthenticated, getSession, getRole)

---

## Coding Conventions

### Naming
- Files: `kebab-case` (e.g., `entra-pkce-auth.service.ts`)
- Components: `PascalCase` exports
- Hooks: `useXxx` prefix, file named `use-xxx.hook.ts`
- Use cases: `XxxUseCase`, file named `xxx.use-case.ts`
- Interfaces: `IXxx` prefix

### React / Next.js
- `'use client'` only when strictly necessary — default to Server Components
- `trailingSlash: true` is enabled — all routes end with `/`
- `reactStrictMode: true` — all `useEffect` logic must guard against double-execution with `useRef(false)`
- **Never use `window.location.search` inside services** — pass URL params explicitly from hooks using `useSearchParams()`

### Dependency Rules (strictly enforced)
- `domain/` has **no external dependencies** — pure TypeScript
- `application/` depends on `domain/` only; hooks receive use-cases via props/module-level singletons
- `infrastructure/` depends on `domain/` + external libraries
- `dependency-injection.ts` is the only place that imports across layers to wire dependencies
- **Never import from `infrastructure/` inside `application/` or `domain/`**

### HTTP
- Use `FetchHttpClient` (from `modules/shared/`) for all backend API calls
- Use `axios` only in `EntraPkceAuthService` for Microsoft token endpoint
- Do not add additional HTTP libraries

### Storage
- **IndexedDB** (via `idb` library): persistent tokens, session, login attempts
- **sessionStorage**: ephemeral cross-page data during auth flow only
- Keys: `pkce_code_verifier`, `pkce_state`, `ms_access_token`, `ms_user_info`, `redirect_after_login`

### shadcn/ui
- Components live in `components/ui/` — **do not edit these files directly**
- Add new components: `npx shadcn@latest add <name>`
- Always create a re-export wrapper in `modules/<name>/application/presentation/ui/`
- Theme: "HEB V3" using OKLCH color space, defined in `app/globals.css`
- Install with: `npx shadcn@latest add <component>`

### Styling
- SCSS modules (`*.module.scss`) for component-scoped styles
- Global styles in `app/globals.css` (design tokens, Tailwind base)
- Tailwind utility classes allowed in JSX

---

## Environment Variables

```env
NEXT_PUBLIC_MICROSOFT_ENTRA_CLIENT_ID=    # Azure AD app client ID
NEXT_PUBLIC_MICROSOFT_ENTRA_TENANT_ID=    # Azure AD tenant ID
NEXT_PUBLIC_MICROSOFT_ENTRA_REDIRECT_URI= # Must match Azure AD registration (e.g. https://<domain>/validate-token)
NEXT_PUBLIC_API_URL=                       # SPIDI backend base URL
```

No `AUTH_SECRET` or server-side secrets — PKCE public client flow only.

---

## Deployment

- **nginx** reverse proxy: port 443 (SSL) → `127.0.0.1:<PORT>` (Next.js)
- `next start -H 127.0.0.1` — binds only to localhost
- Azure AD redirect URI: `https://<domain>/validate-token` (no trailing slash)
- `trailingSlash: true` causes 308 redirects; the redirect URI sent to Microsoft uses the base path

---

## Custom Agent

A `webadmin` agent is configured in `.github/agents/webadmin.agent.md` for UI/UX changes scoped to the presentation layer only.
