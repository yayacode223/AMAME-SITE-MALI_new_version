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
      minify: "esbuild", // Utiliser esbuild au lieu de terser
      // Pas de terserOptions nécessaire avec esbuild
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
          },
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
        },
      },
      sourcemap: mode === "development",
      chunkSizeWarningLimit: 500,
      assetsInlineLimit: 4096,
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom"],
    },
  };
});