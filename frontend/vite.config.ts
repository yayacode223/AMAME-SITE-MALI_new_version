// // vite.config.js
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react-swc";
// import path from "path";
// import svgr from "vite-plugin-svgr";

// export default defineConfig(({ mode }) => {
//   return {
//     server: {
//       allowedHosts: true,
//       host: "::",
//       port: 3000,
//     },
//     plugins: [react(), svgr()].filter(Boolean),
//     resolve: {
//       alias: {
//         "@": path.resolve(__dirname, "./src"),
//       },
//     },
//     build: {
//       target: "es2020",
//       minify: "esbuild",
//       rollupOptions: {
//         output: {
//           manualChunks(id) {
//             // Core React — toujours chargé
//             if (id.includes("node_modules/react/") ||
//                 id.includes("node_modules/react-dom/") ||
//                 id.includes("node_modules/react-router-dom/") ||
//                 id.includes("node_modules/scheduler/")) {
//               return "vendor-react";
//             }
//             // Radix UI (shadcn/ui)
//             if (id.includes("node_modules/@radix-ui/")) {
//               return "vendor-radix";
//             }
//             // Framer Motion
//             if (id.includes("node_modules/framer-motion/")) {
//               return "vendor-motion";
//             }
//             // React Query
//             if (id.includes("node_modules/@tanstack/")) {
//               return "vendor-query";
//             }
//             // date-fns
//             if (id.includes("node_modules/date-fns/")) {
//               return "vendor-date";
//             }
//             // Charts — admin uniquement (lazy loaded)
//             if (id.includes("node_modules/recharts/") ||
//                 id.includes("node_modules/apexcharts/") ||
//                 id.includes("node_modules/react-apexcharts/") ||
//                 id.includes("node_modules/d3-")) {
//               return "vendor-charts";
//             }
//             // FullCalendar — admin uniquement
//             if (id.includes("node_modules/@fullcalendar/")) {
//               return "vendor-calendar";
//             }
//             // Icons
//             if (id.includes("node_modules/lucide-react/") ||
//                 id.includes("node_modules/@heroicons/")) {
//               return "vendor-icons";
//             }
//             // Formulaires
//             if (id.includes("node_modules/zod/") ||
//                 id.includes("node_modules/react-hook-form/") ||
//                 id.includes("node_modules/@hookform/")) {
//               return "vendor-forms";
//             }
//           },
//           chunkFileNames: "assets/[name]-[hash].js",
//           entryFileNames: "assets/[name]-[hash].js",
//           assetFileNames: "assets/[name]-[hash][extname]",
//         },
//       },
//       sourcemap: mode === "development",
//       chunkSizeWarningLimit: 600,
//       assetsInlineLimit: 4096,
//     },
//     optimizeDeps: {
//       include: ["react", "react-dom", "react-router-dom", "framer-motion"],
//     },
//   };
// });

// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import svgr from "vite-plugin-svgr";
import { VitePWA } from "vite-plugin-pwa"; // ← Ajout

export default defineConfig(({ mode }) => {
  return {
    server: {
      allowedHosts: true,
      host: "::",
      port: 3000,
      // Développement hors Docker : l'API et les fichiers uploadés sont servis par le backend
      // lancé sur le poste (./mvnw spring-boot:run). Autre adresse : DEV_BACKEND_URL=http://…
      proxy: {
        "/api": { target: process.env.DEV_BACKEND_URL ?? "http://localhost:8080", changeOrigin: true },
        "/uploads": { target: process.env.DEV_BACKEND_URL ?? "http://localhost:8080", changeOrigin: true },
      },
    },
    plugins: [
      react(),
      svgr(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'web-app-manifest-192x192.png', 'web-app-manifest-512x512.png'],
        manifest: {
          name: "AMAME — Association Malienne d'Appui aux Meilleurs Élèves",
          short_name: 'AMAME',
          description: 'Bourses, concours, orientation et ressources académiques pour les étudiants maliens. 100% gratuit et bénévole.',
          theme_color: '#16a34a',
          background_color: '#f9fafb',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          lang: 'fr',
          icons: [
            {
              src: '/web-app-manifest-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/web-app-manifest-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // config.js est réécrit à chaque démarrage du conteneur : s'il était précaché, le
          // service worker servirait les valeurs figées au moment du build.
          globIgnores: ['**/amame-uploads/**', 'images/**', 'config.js'],
          // Une navigation vers un fichier (média, fichier privé servi par l'API) va au serveur, pas
          // à l'application : sinon index.html s'afficherait à la place, et la redirection de
          // /uploads/ vers le CDN ne serait pas suivie (constat C14).
          navigateFallbackDenylist: [/^\/uploads\//, /^\/api\//],
          runtimeCaching: [
            {
              // Configuration d'exécution : le réseau d'abord, la dernière copie connue hors
              // ligne ou sur un réseau trop lent.
              urlPattern: /\/config\.js$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'runtime-config',
                networkTimeoutSeconds: 3,
                expiration: { maxEntries: 1 },
              },
            },
            // Le cache du service worker survit à la déconnexion et ne distingue pas les comptes :
            // seules les réponses publiques y entrent (écart E44 du suivi de migration). Workbox
            // prend la première règle qui correspond : l'ordre des trois règles /api/ compte.
            {
              // Fichiers privés (CV, photos des inscrits) : jamais dans le cache.
              urlPattern: /\/api\/user\/files\//i,
              handler: 'NetworkOnly',
            },
            {
              // Réponses publiques (bourses, concours, articles…) : gardées pour le hors-ligne.
              urlPattern: /^https?:\/\/[^/]+\/api\/visitor\//i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-public',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24,
                },
              },
            },
            {
              // Tout le reste de l'API (profil connecté, espace membre, administration) : jamais
              // dans le cache. L'ancien « api-cache » est supprimé par src/utils/privateCaches.ts.
              urlPattern: /^https?:\/\/[^/]+\/api\//i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /\/(amame-uploads|static)\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'amame-images-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
          ],
        },
      })
    ].filter(Boolean),  // ← Le .filter(Boolean) est conservé
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // ... tout le reste de ta configuration build reste identique
      target: "es2020",
      minify: "esbuild",
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/react-router-dom/") ||
              id.includes("node_modules/scheduler/")) {
              return "vendor-react";
            }
            if (id.includes("node_modules/@radix-ui/")) {
              return "vendor-radix";
            }
            if (id.includes("node_modules/framer-motion/")) {
              return "vendor-motion";
            }
            if (id.includes("node_modules/@tanstack/")) {
              return "vendor-query";
            }
            if (id.includes("node_modules/date-fns/")) {
              return "vendor-date";
            }
            if (id.includes("node_modules/recharts/") ||
              id.includes("node_modules/apexcharts/") ||
              id.includes("node_modules/react-apexcharts/") ||
              id.includes("node_modules/d3-")) {
              return "vendor-charts";
            }
            if (id.includes("node_modules/@fullcalendar/")) {
              return "vendor-calendar";
            }
            if (id.includes("node_modules/lucide-react/") ||
              id.includes("node_modules/@heroicons/")) {
              return "vendor-icons";
            }
            if (id.includes("node_modules/zod/") ||
              id.includes("node_modules/react-hook-form/") ||
              id.includes("node_modules/@hookform/")) {
              return "vendor-forms";
            }
          },
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
      },
      sourcemap: mode === "development",
      chunkSizeWarningLimit: 600,
      assetsInlineLimit: 4096,
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom", "framer-motion"],
    },
  };
});