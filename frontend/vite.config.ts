// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react-swc";
// import path from "path";
// // import { componentTagger } from "lovable-tagger";
// import svgr from 'vite-plugin-svgr'

// // https://vitejs.dev/config/
// export default defineConfig(({ mode }) => ({
//   server: {
//     allowedHosts: true,
//     host: "::",
//     port: 3000,
//   },
//   plugins: [
//     react(),
//     mode === 'development' &&
//     // componentTagger(),
//     svgr(),
//   ].filter(Boolean),
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
// }));

// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ mode }) => {
  return {
    server: {
      allowedHosts: true,
      host: "::",
      port: 3000,
    },
    plugins: [react(), svgr()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      target: "es2020",
      minify: "esbuild",
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Core React — toujours chargé
            if (id.includes("node_modules/react/") ||
                id.includes("node_modules/react-dom/") ||
                id.includes("node_modules/react-router-dom/") ||
                id.includes("node_modules/scheduler/")) {
              return "vendor-react";
            }
            // Radix UI (shadcn/ui)
            if (id.includes("node_modules/@radix-ui/")) {
              return "vendor-radix";
            }
            // Framer Motion
            if (id.includes("node_modules/framer-motion/")) {
              return "vendor-motion";
            }
            // React Query
            if (id.includes("node_modules/@tanstack/")) {
              return "vendor-query";
            }
            // date-fns
            if (id.includes("node_modules/date-fns/")) {
              return "vendor-date";
            }
            // Charts — admin uniquement (lazy loaded)
            if (id.includes("node_modules/recharts/") ||
                id.includes("node_modules/apexcharts/") ||
                id.includes("node_modules/react-apexcharts/") ||
                id.includes("node_modules/d3-")) {
              return "vendor-charts";
            }
            // FullCalendar — admin uniquement
            if (id.includes("node_modules/@fullcalendar/")) {
              return "vendor-calendar";
            }
            // Icons
            if (id.includes("node_modules/lucide-react/") ||
                id.includes("node_modules/@heroicons/")) {
              return "vendor-icons";
            }
            // Formulaires
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