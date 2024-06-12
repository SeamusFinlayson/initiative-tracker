import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        action: resolve(__dirname, "src/action/action.html"),
        settings: resolve(__dirname, "src/settings/settings.html"),
      },
    },
  },
});
