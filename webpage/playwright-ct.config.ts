import { defineConfig, devices } from "@playwright/experimental-ct-react";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
    testDir: "./src/__tests__",
    timeout: 10_000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: [["html", { open: "never" }]],
    use: {
        ctPort: 3100,
        ctViteConfig: {
            plugins: [react(), tailwindcss()],
            define: {
                // Make fetch URL resolve to /api/parse instead of undefined/api/parse
                "process.env.NEXT_PUBLIC_API_GATEWAY_URL": JSON.stringify(""),
            },
            resolve: {
                alias: { "@": path.resolve(__dirname, "./src") },
            },
        },
        trace: "on",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
