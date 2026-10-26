import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: __dirname,
    plugins: [
        react(),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "@wa": path.resolve(__dirname, "src", "features", "whatsapp"),
            "@shared/schema": path.resolve(__dirname, "packages", "shared", "schema.js"),
            "@shared/whatsapp-schema": path.resolve(__dirname, "packages", "shared", "whatsapp-schema.js"),
            "@shared": path.resolve(__dirname, "packages", "shared"),
        },
    },
    build: {
        outDir: path.resolve(__dirname, "dist"),
        emptyOutDir: true,
    },
    server: {
        port: 5173,
        proxy: {
            "/api/v1": {
                target: "http://127.0.0.1:5000",
                changeOrigin: true,
            },
            "/api": {
                target: "http://127.0.0.1:5000",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api(?!\/v1)/, "/api/v1"),
            },
            "/uploads": {
                target: "http://127.0.0.1:5000",
                changeOrigin: true,
            },
            "/socket.io": {
                target: "http://127.0.0.1:5000",
                ws: true,
                changeOrigin: true,
                configure: (proxy) => {
                    proxy.on("error", (err) => {
                        // Suppress expected transient disconnect errors on reload
                        if (err.code === "ECONNRESET" || err.code === "ECONNREFUSED") return;
                        console.error("[vite socket proxy error]:", err);
                    });
                },
            },
        },
    },
});
