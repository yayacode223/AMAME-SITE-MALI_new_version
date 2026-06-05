# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

AMAME is a platform for Malian students (scholarships, competitions, academic orientation). It is a full-stack project with three independent services:

- `frontend/` — React 18 + Vite + TypeScript + Tailwind CSS (deployed via Nginx + Docker)
- `backend/` — Java 21 + Spring Boot 3 + Spring Security (JWT) + PostgreSQL 15
- `scraper/` — Python scripts for data import

## Commands

### Frontend
```bash
cd frontend
npm run dev          # dev server on port 3000
npm run build        # production build → dist/
npm run lint         # ESLint
npx tsc --noEmit     # type-check without emitting
```

### Backend
```bash
cd backend
./mvnw spring-boot:run   # local dev (requires a running PostgreSQL)
./mvnw test              # run all tests
./mvnw package -DskipTests  # build jar
```

### Docker (recommended for full-stack dev)
```bash
docker compose up -d --build    # build and start all services
docker compose logs -f backend  # stream backend logs
docker compose logs -f frontend
docker compose down
```

Frontend: `http://localhost` — pgAdmin: `http://localhost:5050` — Grafana: `http://localhost:3001`

### Scraper (one-shot, not a long-running service)
```bash
cd scraper && pip install -r requirements.txt
python scraper_etablissement.py   # import universities/etablissements
python scraper_opportunity.py     # import bourses/concours from mina7
```

## Architecture

### Backend — Spring Boot

**Package**: `com.example.siteamame`

**Layer structure**: `controller → service → repository (JPA)` with `mapper` for DTO conversion.

**API route prefixes** (defined in `SecurityConfig.java`):
- `/api/visitor/**` — public (no auth required); user registration is at `/api/visitor/register`
- `/api/auth/**` — login, logout, token refresh
- `/api/user/**` — any authenticated user (USER, MEMBER, ADMIN, SUPERADMIN, EDITOR)
- `/api/admin/**` — admin roles only; per-method `@PreAuthorize` enforces finer-grained access

**Auth**: Stateless JWT stored in **HttpOnly cookies** (not Authorization header). Two tokens:
- Access token (short-lived, 15min in prod)
- Refresh token (7 days) — rotated on each `/api/auth/refresh` call

**File uploads**: stored on disk at `backend/uploads/`, served by the backend at `/uploads/**`, and bind-mounted into the frontend Nginx container so they are accessible under `https://amame.ml/uploads/`.

**Profiles**: `application.properties` (common) + `application-dev.properties` + `application-prod.properties`. Active profile set via `SPRING_PROFILES_ACTIVE` env var (defaults to `dev`).

**Domain entities**: `User`, `Adhesion`, `Article`, `Bourse`, `Concours`, `Filiere`, `Etablissement`, `Galerie`, `LienUtile`, `Membre` (bureau), `Partenaire`, `RessourceAcademique`, `Opportunites`, `Cotisation`, `Don`, `RefreshToken`, `PasswordResetToken`, `UserPermission`.

### Frontend — React + Vite

**No shared layout component for public pages.** Every public page directly imports `<Navbar />` and `<Footer />` — there is no wrapping layout. This is intentional. Admin (`/admin/*`) and member (`/membre/*`) sections each have their own layout components (`LayoutAdmin.tsx`, `LayoutMembre.tsx`) used as nested route wrappers.

**API communication**: A single axios instance at `src/utils/axiosInstance.ts` exports `Api`. It uses `baseURL: "/api"` with `withCredentials: true` (for cookie auth). It includes a response interceptor that automatically retries failed requests after a transparent token refresh on 401 — with a queue to handle concurrent in-flight requests during refresh.

**Service layer**: `src/service/*.ts` files contain React Query hooks (`useQuery`, `useMutation`) that call `Api`. Components consume these hooks directly — no manual fetch/useEffect.

**Auth context**: `src/context/AuthContext.tsx` wraps the app and exposes `{ user, isAuthenticated, isUserLoading, login, logout, register, hasPermission }`. It calls `useGetCurrentUser()` (React Query) on mount to rehydrate session from cookie.

**Routing** (`App.tsx`): All routes live in the `AppContent` inner component (inside `<BrowserRouter>`) to enable `useLocation()` access. `AppContent` conditionally renders `<BottomNav />` and `<PWAInstallBanner />` — suppressed on `/admin/*`, `/membre/*`, and auth pages.

**Mobile navigation**: `<BottomNav />` (`src/components/BottomNav.tsx`) is a fixed bottom bar (mobile only, `lg:hidden`) with 4 primary tabs (Home, Bourses, Concours, Orientation) and a "Plus" Sheet for secondary links. The Navbar hamburger was removed — BottomNav is the sole mobile navigation.

**PWA**: Configured via `vite-plugin-pwa` in `vite.config.ts`. Manifest is fully declared in the plugin config (not in a separate file). The `site.webmanifest` in `public/` exists as a fallback reference. Service worker uses `registerType: 'autoUpdate'` with Workbox for caching and `NetworkFirst` strategy for `/api/*` calls.

**Breakpoints**: Mobile/desktop split is at `lg` (1024px) matching Tailwind's default — consistent across Navbar, BottomNav, Footer padding (`pb-16 lg:pb-0`).

**Tailwind brand tokens**: `amame-green` (#16a34a), `amame-green-dark` (#15803d), `amame-green-subtle` (#f0fdf4), `amame-gold` (#ca8a04), defined in `tailwind.config.ts`.

**Icons**: `lucide-react` v0.446.0 — use named imports.

### Docker compose services summary

| Service | Image tag | Exposed port |
|---|---|---|
| frontend | `yaya236/amame-web-site:frontend-v4.6` | 80 |
| backend | `yaya236/amame-web-site:backend-v4.4` | internal only |
| database | postgres:15-alpine | internal only |
| pgadmin | dpage/pgadmin4 | 5050 |
| prometheus | prom/prometheus | 9090 |
| grafana | grafana/grafana-oss | 3001 |

Update image tags in `docker-compose.yml` before `docker compose up --build` when pushing a new version.

## Critical constraints

- **Never commit secrets.** `JWT_SECRET`, `MAIL_PASSWORD`, `POSTGRES_PASSWORD` must come from environment variables — never hardcoded.
- **Cookie domain**: In production, cookies use `COOKIE_DOMAIN=.amame.ml` + `COOKIE_SECURE=true`. In local dev (`application-dev.properties`), these values differ — verify before testing auth locally.
- **CORS**: The backend allows `FRONTEND` env var origin + `https://*.amame.ml`. Adding a new local origin requires updating `SecurityConfig.java` or the env var.
- **File serving**: Uploaded files must be accessible to Nginx. The `./backend/uploads` directory is bind-mounted into both backend and frontend containers — do not change the volume path without updating both entries in `docker-compose.yml`.
