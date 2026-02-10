import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        // Proxy all /upload-drive requests to backend
        "/upload-drive": {
          target: "http://localhost:5001",
          changeOrigin: true,
          secure: false,
          ws: false,
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, res) => {
              console.log("🚨 Proxy error:", err.message);
              res.writeHead(500, {
                "Content-Type": "text/plain",
              });
              res.end("Proxy error: " + err.message);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log(
                "🔄 Proxying:",
                req.method,
                req.url,
                "→",
                proxyReq.path,
              );
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              console.log(
                "✅ Proxy response:",
                req.method,
                req.url,
                proxyRes.statusCode,
              );
            });
          },
        },
        // Proxy all /api requests to backend
        "/api": {
          target: "http://localhost:5001",
          changeOrigin: true,
          secure: false,
        },
        // Proxy Catbox requests to bypass CORS
        "/catbox-proxy": {
          target: "https://catbox.moe",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/catbox-proxy/, ""),
        },
      },
    },
    plugins: [react()],
    define: {
      "process.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL),
      "process.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY,
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    build: {
      // Changed from 'terser' to 'esbuild'
      minify: "esbuild",
      // ESBuild options (optional)
      esbuild: {
        drop: ["console", "debugger"], // This replaces drop_console and drop_debugger
      },
    },
  };
});
