# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

AMAME is a platform for Malian students (scholarships, competitions, academic orientation). It is a full-stack project with three independent services:

- `frontend/` — React 18 + Vite + TypeScript + Tailwind CSS (deployed via Nginx + Docker)
- `backend/` — Java 21 + Spring Boot 3 + Spring Security (JWT) + PostgreSQL (18 on Neon in production since 2026-11-19, 15 in the local compose), schema versioned with Flyway
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

**Database schema**: owned by Flyway (`src/main/resources/db/migration/V<n>__<description>.sql`). Hibernate runs in `validate` mode and never changes the schema. Any change to a JPA entity needs a new migration script in the same commit; `V1__baseline.sql` is never edited (it describes the production schema exactly; its single correction, before the production baseline, is deviation E47 of the tracking file). Enum columns carry a `CHECK` constraint listing the allowed values: a new value in such an enum needs a migration that recreates the constraint (as `V1_1` does), because `validate` does not check constraints. `SiteAmameApplicationTests` applies every migration to an empty PostgreSQL and fails if entities and schema diverge. Use standard PostgreSQL only (no provider-specific feature).

**File uploads**: services inject the `FileStorageService` interface, never an implementation; the active one is chosen by `STORAGE_PROVIDER`:

- `local` (development, production until the switch, rollback): `LocalFileStorageService`, directory `app.storage.local.upload-dir`;
- `bunny` (production from step 3.5): `BunnyFileStorageService`, through `BunnyStorageClient` (JDK HTTP client, no extra dependency; DT5 budget: 5 s connect, 20 s per attempt, 2 attempts). Two zones (`app.storage.bunny.*`, `BUNNY_*` variables): the public one is the CDN origin, the private one holds `uploads/utilisateur/`; the zone is always deduced from the key, never stored. Startup refuses an incomplete Bunny configuration or an empty `MEDIA_BASE_URL`. The `bunnyStorage` health indicator reports the last real call and never calls Bunny itself; it is outside the liveness and readiness probes.

Every upload goes through `UploadValidator`, which reads the type from the file's magic bytes, never from the client's Content-Type or extension. A file is identified by its key `uploads/<folder>/<uuid>.<ext>` (`StoragePaths`); a key is never rewritten — replacing a file creates a new key. The database enforces it (migration V2: unique key, key format, a trigger refuses any change of `file_path`; V5: every constraint validated, `file_sha256` mandatory) and stores the SHA-256 of each upload (`file_sha256`), which Bunny checks on receipt.

**File lifecycle** (migration step 2): services never delete a stored object. The object is written before its `file_entity` row is committed; if the transaction rolls back, `UploadCompensation` deletes it at once (write methods that upload use `@Transactional(rollbackFor = Exception.class)`). Replacing or deleting a file only removes its row — the 8 entities and `User.files` use `orphanRemoval`, and `User.files` is modified in place, never replaced. A database trigger (V3) then writes the key into `storage_purge_queue`, and `StoragePurgeJob` deletes the object after `STORAGE_PURGE_RETENTION` (10 days, longer than any database restore window). The purge is off unless `STORAGE_PURGE_ENABLED=true`, production only. `FileStorageService.delete(key)` is reserved for the purge and the compensation. Never `TRUNCATE file_entity` (refused by a trigger).

**Media URLs**: the database stores keys only, never a URL. `MediaUrlResolver` is the single place where a key becomes a URL, from `MEDIA_BASE_URL` (empty → relative `/uploads/…`). DTOs expose `fileUrl` / `coverImageUrl` next to the legacy `filePath` / `coverImagePath`. In `local` mode the files are on disk at `backend/uploads/`, served by Nginx under `/uploads/` (and by Spring outside Docker).

**Private files**: everything under `uploads/utilisateur/` (CVs and photos of registered users) is private. Nginx answers 404 on `/uploads/utilisateur/` and `/amame-uploads/utilisateur/`, Spring Security denies the static path, and the only way to read such a file is `GET /api/user/files/{id}` (`PrivateFileController`: the owner, or a holder of `USER_READ_ALL`). `UserReponseDto` exposes `imageUrl` and `cvUrl` for that purpose — the frontend must use them, never build a URL from `imagePath`/`cvPath`.

**Roles**: a role is never read from a request body. Registration (`/api/visitor/register`, public) always creates a `USER`, and profile update never changes the role. A role changes only through `PUT /api/admin/users/{id}/role` (`PermissionService.changeRole`: requires `USER_MANAGE_ROLES`, and only for roles strictly below the caller's rank).

**First administrator**: no default account. On an empty `users` table, an `ADMIN` is created at startup only if `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` are set.

**Profiles**: `application.properties` (common) + `application-dev.properties` + `application-prod.properties`. Active profile set via `SPRING_PROFILES_ACTIVE` env var (defaults to `dev`). Every infrastructure value comes from an environment variable documented in `.env.example`.

**Empty environment variables**: an environment variable that is set but empty (or only spaces) is treated as absent, so the default of its `${VAR:default}` placeholder applies (`EmptyEnvironmentVariablesPostProcessor`, deviation E51). The production stack passes every undefined variable as an empty string. Never give "empty" a meaning different from "absent" for a new variable.

**Sparing the database** (it is billed by awake time on Neon): the HikariCP pool keeps no idle connection by default (`DB_POOL_*`), auto-commit is off so a transaction borrows a connection only at its first SQL statement, no health probe queries the database, and every scheduled task that touches it runs in the same nightly window (02:30 UTC). Do not add polling, a keep-alive, or a frequent `@Scheduled` job that hits the database.

**Caches** (`CacheConfig`, in-memory Caffeine):
- `requestUser`: the user loaded by `JwtFilter` on each authenticated request, kept 60 s (`RequestUserLoader`). Any method that changes a role, permissions or a password, or deletes a user, must carry `@CacheEvict(cacheNames = CacheConfig.REQUEST_USER, allEntries = true)`. Login never uses this cache. The cached `User` is detached and shared: never modify it.
- `publicLists`: public list endpoints annotated with `@PublicListCache`. Disabled unless `PUBLIC_LISTS_CACHE_TTL` is a positive duration; emptied after any non-GET request on `/api/admin/**`. Do not annotate an endpoint that writes (view counters) or depends on the caller.

**Error responses** (report 05, P3a): every error body is an `ApiError` with a stable `code` (`ApiErrorCode`: `EMAIL_ALREADY_USED`, `VALIDATION_FAILED` with `fieldErrors`, `INTERNAL_ERROR`…) and a `message` that is always a sentence for the user, never an exception's text. `GlobalHandlerException` logs every unexpected error with an 8-character reference that the message repeats. Throw a dedicated exception or a `ResponseStatusException` with a French reason; never a bare `RuntimeException` for an expected case (it becomes a 500). A missing item is a `RessourceNotFoundException` (404) whose message is a sentence without any id ("Cet article est introuvable : il a peut-être été supprimé."); a value refused by a service rule is an `InvalidFieldException(field, message)` (400 `VALIDATION_FAILED`, shown under that field). A controller method that only delegates to a transactional service carries no `@Transactional` of its own (deviation C15: without `rollbackFor` it turned an upload failure into "Transaction silently rolled back"); a service method that writes, even a view counter, is never `readOnly`.

**Domain entities**: `User`, `Adhesion`, `Article`, `Bourse`, `Concours`, `Filiere`, `Etablissement`, `Galerie`, `LienUtile`, `Membre` (bureau), `Partenaire`, `RessourceAcademique`, `Opportunites`, `Cotisation`, `Don`, `RefreshToken`, `PasswordResetToken`, `UserPermission`.

### Frontend — React + Vite

**No shared layout component for public pages.** Every public page directly imports `<Navbar />` and `<Footer />` — there is no wrapping layout. This is intentional. Admin (`/admin/*`) and member (`/membre/*`) sections each have their own layout components (`LayoutAdmin.tsx`, `LayoutMembre.tsx`) used as nested route wrappers.

**API communication**: A single axios instance at `src/utils/axiosInstance.ts` exports `Api`. It uses `baseURL: "/api"` with `withCredentials: true` (for cookie auth). It includes a response interceptor that automatically retries failed requests after a transparent token refresh on 401 — with a queue to handle concurrent in-flight requests during refresh.

**Service layer**: `src/service/*.ts` files contain React Query hooks (`useQuery`, `useMutation`) that call `Api`. Components consume these hooks directly — no manual fetch/useEffect.

**Error messages** (report 05, P3a): turn any API error into a message with `toUserError` / `userMessage` (`src/utils/apiError.ts`), never `err.message` or a raw `response.data.message`. It handles network loss, Nginx HTML replies (429, 413, 502, 504) and hides old technical 500 texts. A form shows its error inside the form (`<FormAlert>` above the submit button, `applyFieldErrors` under the fields); toasts are for confirmations. Field error text uses `red-700` (contrast), not `text-destructive`. A failed load shows `<QueryError error onRetry>` (P3b), never an empty list or an empty form; in the admin, `DataTable` takes `error`/`onRetry` and an `onDelete` that returns the `mutateAsync` promise (the confirm dialog stays open and shows the failure), and `FormWrapper` takes `error` (save) and `loadError` (item to edit). An edit form loads its item by id (`useGet…ById`), never by searching a paginated list. Queries are not retried after a 4xx (`src/lib/queryClient.ts`). `<ErrorBoundary>` wraps the whole app (`App.tsx`) and the content of the admin and member layouts (`variant="section"`, the menu stays usable): a rendering error shows "Un problème est survenu", never a blank page. On public pages (docs/06, R2), a list shows `<QueryError>` when the query's `isLoadingError` is true, never its empty state (a failed background refetch keeps the data on screen); a detail page keeps its own "… non trouvé" screen for a 404 or an invalid id (`isNotFound`, `src/utils/apiError.ts`) and shows `<DetailLoadError>` (reason, "Réessayer", back link) for any other failure; a page with alternative queries (list / search / filter) reads data, loading and error from the active one. Queries and mutations use `networkMode: "always"`: React Query's default pauses them silently after the browser's `offline` event (an empty list, a button stuck on "Envoi…"), and the service worker can only answer from its `api-public` cache if the request is sent.

**Auth context**: `src/context/AuthContext.tsx` wraps the app and exposes `{ user, isAuthenticated, isUserLoading, login, logout, register, hasPermission }`. It calls `useGetCurrentUser()` (React Query) on mount to rehydrate session from cookie.

**Protected pages and login return** (report 05, P2): `/admin/*` and `/membre/*` are guarded by `<RequireAuth>` (`src/components/RequireAuth.tsx`) in `App.tsx`, never by a check inside a layout. A visitor goes to `/login?redirect=<page>&raison=acces`, and `/login` sends them back after login. Every link to the login page uses `loginPath(location)` (`src/utils/authRedirect.ts`), never a bare `"/login"`. The `redirect` value is only followed through `safeRedirectPath` (paths of this site only, no open redirect). When `/api/auth/refresh` is refused (401/403/404) while a user is shown, the Axios interceptor clears the user and the guard sends to `/login?…&raison=session`; a network failure logs nobody out.

**Routing** (`App.tsx`): All routes live in the `AppContent` inner component (inside `<BrowserRouter>`) to enable `useLocation()` access. `AppContent` conditionally renders `<BottomNav />` and `<PWAInstallBanner />` — suppressed on `/admin/*`, `/membre/*`, and auth pages.

**Mobile navigation**: `<BottomNav />` (`src/components/BottomNav.tsx`) is a fixed bottom bar (mobile only, `lg:hidden`) with 4 primary tabs (Home, Bourses, Concours, Orientation) and a "Plus" Sheet for secondary links. The Navbar hamburger was removed — BottomNav is the sole mobile navigation.

**PWA**: Configured via `vite-plugin-pwa` in `vite.config.ts`. Manifest is fully declared in the plugin config (not in a separate file). The `site.webmanifest` in `public/` exists as a fallback reference. Service worker uses `registerType: 'autoUpdate'` with Workbox for caching and `NetworkFirst` strategy for `/api/*` calls. The favicons and the manifest icons are kept out of the precache (`includeManifestIcons: false` and `globIgnores`): they were half of every visitor's offline download, and the browser fetches them itself for the tab and for installation. Navigations to `/uploads/` and `/api/` bypass the app shell (`navigateFallbackDenylist`): a media link must reach Nginx (and its redirect to the CDN), a private file opened in a tab must reach the API. After a deployment, `src/utils/appUpdate.ts` (called from `main.tsx`) reloads the page when the new version takes control, at once if nothing was typed, otherwise at the next route change; it also reloads once on `vite:preloadError` (an old lazy chunk that no longer exists).

**Breakpoints**: Mobile/desktop split is at `lg` (1024px) matching Tailwind's default — consistent across Navbar, BottomNav, Footer padding (`pb-16 lg:pb-0`).

**Page container**: the main column of every public page, the navbar and the footer use `.page-container` (`src/index.css`): centered, 1280 px max including padding, side padding 16 px, 24 px from `sm`, 32 px from `lg`, so their edges stay aligned. Never use Tailwind's `container` (configured at 1400 px, still used by the member area) or rebuild `max-w-7xl mx-auto px-…` by hand for a page column; a narrower reading width is an extra `max-w-*` class or an inner wrapper. The design plan and its tracking live in `docs/04-amelioration-design-accueil.md`.

**Cards**: a card on a public page uses the `.amame-card-*` classes of `src/index.css` (card, media zone `-media` / `-media-portrait` / `-media-person` / `-media-logo`, `-img`, `-body`, `-title`, `-text`, `-footer`, `-action`), and its loading state uses `<CardSkeleton>` with the same media type and layout. A person's photo (members) uses `-media-person` (square, 4:5 from `sm`) with the image `absolute inset-0 object-cover object-top`: a landscape zone centred on a head-and-shoulders or full-length photo cuts the face off (docs/06, R6). `.amame-card-row` puts the media on the left from `sm` (articles, guides, job posts). A white block that is not a card (detail-page panel, sidebar, form block) uses `.amame-panel` (same radius, border and shadow). Add `.amame-card-interactive` only when the whole card is a link (`<Link className="amame-card amame-card-interactive group">`): it lifts on hover and gets the green focus ring; a card that is not a link does not move, only its footer link reacts. The domain color (gold for bourses, blue for concours, green for the rest) is for the icon, the title on hover and the action link, in a dark shade for text (`amber-700`, `blue-600`, `amame-green-dark`: at least 4.5:1 on white). Do not use the `shadow-card` utility: the name also matches the shadcn `card` color, so Tailwind emits a white shadow color after the shadow and the resting shadow is invisible; `.amame-card` sets the shadow itself.

**Tailwind brand tokens**: `amame-green` (#16a34a), `amame-green-dark` (#15803d), `amame-green-deep` (#166534), `amame-green-darker` (#14532d), `amame-green-subtle` (#f0fdf4), `amame-gold` (#ca8a04), defined in `tailwind.config.ts`.

**Green behind text** (docs/06, E7): a green background that carries text (button, active filter or page, avatar initials, band) is `bg-amame-green-dark` with `hover:bg-amame-green-deep` (white at 5.0:1 and 7.1:1), never `bg-amame-green` (white at 3.3:1, below the 4.5:1 minimum). `bg-amame-green` stays for what carries no text: dots, bars, icons, borders, gradients. shadcn's `--primary` is the same #15803d, and the default `Button` hovers to `amame-green-deep` (a `/90` transparency lightens it below 4.5:1). Light text on the dark footer green uses at least `text-green-100/70`.

**Opacity modifiers**: Tailwind 3.4 generates `/<n>` only for its opacity scale (0, 5, 10 … 95, 100). `/72` or `/58` produce no class at all, silently (this is why the photo overlays of Adhésion and the login page were never rendered, docs/06 S1): use the scale or an arbitrary value (`/[.72]`).

**Text on photos**: white text on a photo needs a dark layer under it, from `src/index.css`; there is no green veil any more.

- Page heroes with left-aligned text (`PageHero`, the About hero) use `.amame-hero-scrim`. It is black and darkest under the text: a gradient to the right from `lg`, the whole photo below `lg` (docs/06, E9).
- Elsewhere, `.amame-photo-cartouche` (black at 55 %, blur) goes on each text block and leaves the photo natural (docs/06, E8). It is used on Adhésion, the login panel and band, and the back link of Mot de passe oublié. White keeps 4.76:1 on it even over pure white, so it holds for any photo.

On a photo:

- a pill is a solid `bg-amame-green-dark`, never `bg-white/15` (white fell to 2.9–4.2:1);
- a highlighted word is `text-green-300`, never `text-amame-green` (down to 1.0:1);
- gold is `amber-300` (the brand gold reaches 1.8:1);
- `green-300` and `amber-300` are for large text only;
- body text is full white, not `text-white/80`.

Measure every text on a photo at the photo's brightest spot (4.5:1, 3:1 for a large title) at 390, 768, 1024 and 1440 px. Include translucent backgrounds: only an opaque background may be skipped. The R1 check skipped translucent backgrounds and left out the page heroes, where 96 texts were below the threshold (docs/06, R5). Do not lighten a layer without measuring again.

**Fonts**: Inter (text) and Nunito (`font-nunito`, headings) are served by the site, never by Google: variable `woff2` files in `src/assets/fonts/` (license `OFL.txt`), two subsets each (`latin`, `latin-ext`), declared by the `@font-face` rules at the top of `src/index.css`; `index.html` preloads the two `latin` files (Vite rewrites the `/src/assets/fonts/…` paths to the hashed names), which keeps the font swap from shifting the hero. Do not add a Google Fonts `@import`, `<link>` or `preconnect`. The `latin-ext` files are excluded from the PWA precache (`globIgnores` in `vite.config.ts`): the browser fetches them only for a page that contains one of their characters. Nunito has no ɛ, ɔ or ɲ: those letters fall back to another font.

**Icons**: `lucide-react` v0.446.0 — use named imports.

**Uploaded media** (article images, galleries, member photos, documents): never build a media URL by hand and never hardcode a domain. Use the URL computed by the backend through `mediaUrl(dto.fileUrl ?? dto.filePath)` (`src/utils/media.ts`) or `<MediaImage src={dto.fileUrl ?? dto.filePath} maxWidth={…} sizes="…" />`. Resizing parameters are added only when `MEDIA_OPTIMIZER_ENABLED=true`. File inputs for images use `IMAGE_ACCEPT` (`src/utils/uploadFormats.ts`), aligned with the backend's `UploadValidator`.

**Runtime configuration**: `MEDIA_BASE_URL` and `MEDIA_OPTIMIZER_ENABLED` are read when the container starts, not at build time. `docker/40-runtime-config.sh` rewrites `/config.js` (dev default: `public/config.js`), `index.html` loads it before the app, and `src/utils/runtimeConfig.ts` exposes it. It is excluded from the PWA precache and served with `no-store`. Do not reintroduce a `VITE_*` build variable for a value that differs between environments.

**Nginx headers** (`frontend/nginx.conf`): a `location` that sets its own `add_header` inherits none of the `server` level's. The security headers therefore live in `frontend/docker/security-headers.conf`, included at the `server` level and after the `add_header` of every location (and in `docker/uploads-disk.conf`): a new location with an `add_header` must include it too. A cache duration is set by `add_header Cache-Control` alone, never with `expires` as well (that sent a second `Cache-Control` and an `Expires`). `sw.js` and `registerSW.js` are served `no-cache`. In production, Nginx Proxy Manager's "Cache Assets" option on `amame.ml` overrides the site's `Cache-Control` and must stay off (docs/06, S3).

**Local dev outside Docker**: `npm run dev` proxies `/api` and `/uploads` to `http://localhost:8080` (`DEV_BACKEND_URL` to override).

**Static images** (heroes, illustrations): never put a large image in `public/` and never write an image path by hand. Originals live in `frontend/image-sources/<group>/<name>.png` (not served, excluded from the Docker build). `python scripts/optimize_images.py` (requires Pillow) generates WebP variants in `public/static/` and the typed manifest `src/generated/staticImages.ts`. Display them with `<StaticImage name="<group>/<name>" sizes="…" />` (srcset, intrinsic dimensions, lazy loading; `priority` for the page's main image), or `staticImageUrl(name)` for a CSS background. The logo used by the UI is `/logo-192.webp`; `public/amame-uploads/amame-logo.webp` stays only because Open Graph and JSON-LD tags point to it.

**Home hero video**: the original is `frontend/video-sources/home/amame-hero.mp4` (not served, excluded from the Docker build). `python scripts/encode_hero_video.py` (requires ffmpeg) writes the seamless 7.3 s loop in two renditions, `src/assets/video/hero-16x9.mp4` and `hero-4x5.mp4` (portrait, for phones), each under 1 MB (the script fails otherwise), and the poster original `image-sources/home/hero-poster.png`; run `optimize_images.py` afterwards. Videos are imported from `src/assets/`, never put in `public/`: Vite hashes their names, Nginx caches `/assets/` for a year, and no service-worker route or precache entry touches them (a video under `/static/` would hit the `CacheFirst` image rule). `HeroVideo.tsx` shows the poster first (the page's LCP) and requests the video only after the poster and the page have loaded, never with reduced motion, Save-Data, offline or a 2G/3G connection; it pauses off screen and has a Pause button (WCAG 2.2.2).

### Docker compose services summary

| Service | Image tag | Exposed port |
|---|---|---|
| frontend | `yayacode224/amame:${FRONTEND_IMAGE_TAG}` (default `frontend-v1.20`) | 80 |
| backend | `yayacode224/amame:${BACKEND_IMAGE_TAG}` (default `backend-v1.7`) | internal only |
| database | postgres:15-alpine | internal only |
| pgadmin | dpage/pgadmin4 | 127.0.0.1:5050 |

Stack `amame-ops` (`ops/docker-compose.yml`): `backup` (`yayacode224/amame:${OPS_IMAGE_TAG}`, default `ops-v1.3`, PostgreSQL 18; for `restore-db.sh` into the local PostgreSQL 15, use `ops-v1.2.1` and `OPS_PG_MAJOR=15`) and `scraper` (`yayacode224/amame:${SCRAPER_IMAGE_TAG}`, default `scraper-v1.1`), no exposed port.

Bump the default tags (or set the `*_IMAGE_TAG` variables) before `docker compose up --build` when pushing a new version. Tags are versioned, never `latest`: rolling back means putting the previous tag back.

**Production is not deployed from these compose files.** The Portainer stacks `amamestack` and `amame-ops` are pasted from `deploy/portainer/amamestack.yml` and `deploy/portainer/amame-ops.yml`, which describe the real server: no `build`, external network `common_net` shared with Nginx Proxy Manager (which owns host port 80) and another project; `common_net` is **internal** (no Internet access), so a container that must reach the Internet also joins its stack's own `sortie` network; Nginx Proxy Manager reaches the frontend as `amame-frontend:80`, no host port published; another project's service is also named `backend` on `common_net`, so the frontend has `links: [backend]` and the backend `links: [database]` (never remove them, and address containers from other stacks by container name, e.g. `amame-database`); absolute `UPLOADS_HOST_PATH`, image tags with no default. Images are built with `docker build` and pushed to Docker Hub; there is no SSH access to the server, only Portainer and container consoles. A change to a service, a variable or a volume must be reported in the matching production file.

## Critical constraints

- **Never commit secrets.** `JWT_SECRET`, `MAIL_PASSWORD`, `POSTGRES_PASSWORD`, `BACKUP_PASSPHRASE` and the Bunny zone keys must come from environment variables — never hardcoded, and never with a default value in a compose file. In production they are Portainer stack variables; `.env.example` documents all of them.
- **The schema changes only through Flyway.** Never set `ddl-auto` back to `update`, never edit `V1__baseline.sql`, never change the production schema by hand.
- **The database stores file keys, never URLs or bytes.** A key is immutable.
- **Backend memory is measured on the container, not on the JVM.** The limit is 512 MB; the JVM's own figures miss the native memory. Any new dependency or large in-memory buffer needs a new measurement under load (`docker stats`, `memory.stat`). Read files in small chunks (`StorageIo`).
- **Never commit user data.** `backend/uploads/` and every `.env` are ignored by Git and must stay untracked.
- **Backup keys stay in `amame-ops`.** `BUNNY_BACKUP_ZONE_KEY` and `BACKUP_PASSPHRASE` must never be added to the application stack.
- **Cookie domain**: In production, cookies are host-only (`COOKIE_DOMAIN` empty) + `COOKIE_SECURE=true`: they are never sent to a subdomain, in particular not to the media CDN (deviation E50). In local dev (`application-dev.properties`), `COOKIE_SECURE` is false — verify before testing auth locally. A browser may hold several `refresh_token` cookies (one per domain) and sends the oldest first: refresh tries each of them and logout revokes them all, so changing `COOKIE_DOMAIN` no longer ends open sessions.
- **CORS**: The backend allows `FRONTEND` env var origin + `https://*.amame.ml`. Adding a new local origin requires updating `SecurityConfig.java` or the env var.
- **File serving**: Uploaded files must be accessible to Nginx. The `./backend/uploads` directory is bind-mounted into both backend and frontend containers — do not change the volume path without updating both entries in `docker-compose.yml`.
