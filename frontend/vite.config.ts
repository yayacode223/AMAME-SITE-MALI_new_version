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
          globIgnores: ['**/amame-uploads/**', 'images/**'],
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/.*\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24,
                },
              },
            },
            {
              urlPattern: /\/amame-uploads\/.*/i,
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