import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const webRoot = path.dirname(
    fileURLToPath(import.meta.url)
);

export default defineConfig({
    root: webRoot,

    plugins: [react()],

    server: {
        host: "127.0.0.1",
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:3001",
                changeOrigin: true,
            },
        },
    },
});
