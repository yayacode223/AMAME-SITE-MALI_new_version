# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

AMAME is a platform for Malian students (scholarships, competitions, academic orientation). It is a full-stack project with three independent services:

- `frontend/` — React 18 + Vite + TypeScript + Tailwind CSS (deployed via Nginx + Docker)
- `backend/` — Java 21 + Spring Boot 3 + Spring Security (JWT) + PostgreSQL 15, schema versioned with Flyway
- `scraper/` — Python scripts for data import
- `ops/` — operations stack `amame-ops`: scheduled backups, restore tests, on-demand scrapers (see `ops/README.md`)

## Ongoing migration: database → Neon, files → Bunny

The migration is implemented step by step. `docs/03-implementation-migration-neon-bunny.md` is both the design reference and the **tracking file**: read its section "Suivi de l'implémentation" first (current step, next action, pending manual actions, deviations), and update it after every implementation.

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
./mvnw spring-boot:run   # local dev (requires a running PostgreSQL, default localhost:5454)
./mvnw test              # run all tests (Docker must be running: Testcontainers starts a throwaway PostgreSQL)
./mvnw test -Dtest='!SiteAmameApplicationTests'   # unit tests only, no Docker needed
./mvnw package -DskipTests  # build jar
```

The database connection is read from `DATABASE_URL` (JDBC URL), `DATABASE_USERNAME`, `DATABASE_PASSWORD`, and for Flyway `DATABASE_MIGRATION_USERNAME` / `DATABASE_MIGRATION_PASSWORD`. The `dev` profile has local defaults; the `prod` profile has none and refuses to start without them.

### Docker (recommended for full-stack dev)
```bash
docker compose up -d --build    # build and start all services
docker compose logs -f backend  # stream backend logs
docker compose logs -f frontend
docker compose down
```

A root `.env` is required (copy `.env.example`): the compose file refuses to start without `POSTGRES_PASSWORD`, `JWT_SECRET`, `MAIL_*` and `PGADMIN_PASSWORD`.

Frontend: `http://localhost` — pgAdmin: `http://localhost:5050` (listens on `127.0.0.1` only)

There is no monitoring stack for now: Prometheus, Grafana and postgres-exporter were removed on 2026-10-04 (see the tracking file, deviation E14, before adding them back).

### Operations stack (`amame-ops`)
```bash
docker compose -f ops/docker-compose.yml --env-file .env build   # backup image + scraper image
docker compose -f ops/docker-compose.yml --env-file .env up -d
docker exec amame-ops-backup backup.sh          # coupled backup: database dump + uploaded files
docker exec amame-ops-backup restore-test.sh    # restore the latest dump in a throwaway PostgreSQL and check the files
```

### Scraper (on demand, never at deploy time)
The scripts read the connection from the `DATABASE_URL` environment variable — no credentials in code. For the scrapers it is a libpq URL (`postgresql://…`); for the backend the variable of the same name is a JDBC URL (`jdbc:postgresql://…`). They never share a container.
```bash
cd scraper && pip install -r requirements.txt
export DATABASE_URL="postgresql://postgres:<password>@localhost:5454/amame_db"
python scraper_etablissement.py   # import universities/etablissements
python scraper_opportunity.py     # import bourses/concours from mina7
```
In production they run from the console of the idle `amame-scraper` container (stack `amame-ops`).

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

**Database schema**: owned by Flyway (`src/main/resources/db/migration/V<n>__<description>.sql`). Hibernate runs in `validate` mode and never changes the schema. Any change to a JPA entity needs a new migration script in the same commit; `V1__baseline.sql` is never edited. `SiteAmameApplicationTests` applies every migration to an empty PostgreSQL and fails if entities and schema diverge. Use standard PostgreSQL only (no provider-specific feature).

**File uploads**: services inject the `FileStorageService` interface, never an implementation; the active one is chosen by `STORAGE_PROVIDER` (`local` only for now: `LocalFileStorageService`, directory `app.storage.local.upload-dir`). Every upload goes through `UploadValidator`, which reads the type from the file's magic bytes, never from the client's Content-Type or extension. A file is identified by its key `uploads/<folder>/<uuid>.<ext>` (`StoragePaths`); a key is never rewritten — replacing a file creates a new key.

**Media URLs**: the database stores keys only, never a URL. `MediaUrlResolver` is the single place where a key becomes a URL, from `MEDIA_BASE_URL` (empty → relative `/uploads/…`). DTOs expose `fileUrl` / `coverImageUrl` next to the legacy `filePath` / `coverImagePath`. In `local` mode the files are on disk at `backend/uploads/`, served by Nginx under `/uploads/` (and by Spring outside Docker).

**Private files**: everything under `uploads/utilisateur/` (CVs and photos of registered users) is private. Nginx answers 404 on `/uploads/utilisateur/` and `/amame-uploads/utilisateur/`, Spring Security denies the static path, and the only way to read such a file is `GET /api/user/files/{id}` (`PrivateFileController`: the owner, or a holder of `USER_READ_ALL`). `UserReponseDto` exposes `imageUrl` and `cvUrl` for that purpose — the frontend must use them, never build a URL from `imagePath`/`cvPath`.

**Roles**: a role is never read from a request body. Registration (`/api/visitor/register`, public) always creates a `USER`, and profile update never changes the role. A role changes only through `PUT /api/admin/users/{id}/role` (`PermissionService.changeRole`: requires `USER_MANAGE_ROLES`, and only for roles strictly below the caller's rank).

**First administrator**: no default account. On an empty `users` table, an `ADMIN` is created at startup only if `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` are set.

**Profiles**: `application.properties` (common) + `application-dev.properties` + `application-prod.properties`. Active profile set via `SPRING_PROFILES_ACTIVE` env var (defaults to `dev`). Every infrastructure value comes from an environment variable documented in `.env.example`.

**Sparing the database** (it will be billed by awake time on Neon): the HikariCP pool keeps no idle connection by default (`DB_POOL_*`), auto-commit is off so a transaction borrows a connection only at its first SQL statement, no health probe queries the database, and every scheduled task that touches it runs in the same nightly window (02:30 UTC). Do not add polling, a keep-alive, or a frequent `@Scheduled` job that hits the database.

**Caches** (`CacheConfig`, in-memory Caffeine):
- `requestUser`: the user loaded by `JwtFilter` on each authenticated request, kept 60 s (`RequestUserLoader`). Any method that changes a role, permissions or a password, or deletes a user, must carry `@CacheEvict(cacheNames = CacheConfig.REQUEST_USER, allEntries = true)`. Login never uses this cache. The cached `User` is detached and shared: never modify it.
- `publicLists`: public list endpoints annotated with `@PublicListCache`. Disabled unless `PUBLIC_LISTS_CACHE_TTL` is a positive duration; emptied after any non-GET request on `/api/admin/**`. Do not annotate an endpoint that writes (view counters) or depends on the caller.

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

**Uploaded media** (article images, galleries, member photos, documents): never build a media URL by hand and never hardcode a domain. Use the URL computed by the backend through `mediaUrl(dto.fileUrl ?? dto.filePath)` (`src/utils/media.ts`) or `<MediaImage src={dto.fileUrl ?? dto.filePath} maxWidth={…} sizes="…" />`. Resizing parameters are added only when `MEDIA_OPTIMIZER_ENABLED=true`. File inputs for images use `IMAGE_ACCEPT` (`src/utils/uploadFormats.ts`), aligned with the backend's `UploadValidator`.

**Runtime configuration**: `MEDIA_BASE_URL` and `MEDIA_OPTIMIZER_ENABLED` are read when the container starts, not at build time. `docker/40-runtime-config.sh` rewrites `/config.js` (dev default: `public/config.js`), `index.html` loads it before the app, and `src/utils/runtimeConfig.ts` exposes it. It is excluded from the PWA precache and served with `no-store`. Do not reintroduce a `VITE_*` build variable for a value that differs between environments.

**Local dev outside Docker**: `npm run dev` proxies `/api` and `/uploads` to `http://localhost:8080` (`DEV_BACKEND_URL` to override).

**Static images** (heroes, illustrations): never put a large image in `public/` and never write an image path by hand. Originals live in `frontend/image-sources/<group>/<name>.png` (not served, excluded from the Docker build). `python scripts/optimize_images.py` (requires Pillow) generates WebP variants in `public/static/` and the typed manifest `src/generated/staticImages.ts`. Display them with `<StaticImage name="<group>/<name>" sizes="…" />` (srcset, intrinsic dimensions, lazy loading; `priority` for the page's main image), or `staticImageUrl(name)` for a CSS background. The logo used by the UI is `/logo-192.webp`; `public/amame-uploads/amame-logo.webp` stays only because Open Graph and JSON-LD tags point to it.

### Docker compose services summary

| Service | Image tag | Exposed port |
|---|---|---|
| frontend | `yayacode224/amame:${FRONTEND_IMAGE_TAG}` (default `frontend-v1.2`) | 80 |
| backend | `yayacode224/amame:${BACKEND_IMAGE_TAG}` (default `backend-v1.2`) | internal only |
| database | postgres:15-alpine | internal only |
| pgadmin | dpage/pgadmin4 | 127.0.0.1:5050 |

Stack `amame-ops` (`ops/docker-compose.yml`): `backup` (`yayacode224/amame:${OPS_IMAGE_TAG}`, default `ops-v1.0`) and `scraper` (`yayacode224/amame:${SCRAPER_IMAGE_TAG}`, default `scraper-v1.1`), no exposed port.

Bump the default tags (or set the `*_IMAGE_TAG` variables) before `docker compose up --build` when pushing a new version. Tags are versioned, never `latest`: rolling back means putting the previous tag back.

## Critical constraints

- **Never commit secrets.** `JWT_SECRET`, `MAIL_PASSWORD`, `POSTGRES_PASSWORD`, `BACKUP_PASSPHRASE` and the Bunny zone keys must come from environment variables — never hardcoded, and never with a default value in a compose file. In production they are Portainer stack variables; `.env.example` documents all of them.
- **The schema changes only through Flyway.** Never set `ddl-auto` back to `update`, never edit `V1__baseline.sql`, never change the production schema by hand.
- **The database stores file keys, never URLs or bytes.** A key is immutable.
- **Backend memory is measured on the container, not on the JVM.** The limit is 512 MB; the JVM's own figures miss the native memory. Any new dependency or large in-memory buffer needs a new measurement under load (`docker stats`, `memory.stat`). Read files in small chunks (`StorageIo`).
- **Never commit user data.** `backend/uploads/` and every `.env` are ignored by Git and must stay untracked.
- **Backup keys stay in `amame-ops`.** `BUNNY_BACKUP_ZONE_KEY` and `BACKUP_PASSPHRASE` must never be added to the application stack.
- **Cookie domain**: In production, cookies use `COOKIE_DOMAIN=.amame.ml` + `COOKIE_SECURE=true`. In local dev (`application-dev.properties`), these values differ — verify before testing auth locally.
- **CORS**: The backend allows `FRONTEND` env var origin + `https://*.amame.ml`. Adding a new local origin requires updating `SecurityConfig.java` or the env var.
- **File serving**: Uploaded files must be accessible to Nginx. The `./backend/uploads` directory is bind-mounted into both backend and frontend containers — do not change the volume path without updating both entries in `docker-compose.yml`.
