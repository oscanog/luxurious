import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const esToolkitCompat = (name: string) =>
  path.resolve(__dirname, `./src/vendor/es-toolkit-compat/${name}.ts`);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Vite 8/Rolldown minifies a Recharts CommonJS helper into `var t=t()`,
    // which crashes production with "TypeError: t is not a function".
    minify: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "es-toolkit/compat/get": esToolkitCompat("get"),
      "es-toolkit/compat/isPlainObject": esToolkitCompat("isPlainObject"),
      "es-toolkit/compat/last": esToolkitCompat("last"),
      "es-toolkit/compat/maxBy": esToolkitCompat("maxBy"),
      "es-toolkit/compat/minBy": esToolkitCompat("minBy"),
      "es-toolkit/compat/omit": esToolkitCompat("omit"),
      "es-toolkit/compat/range": esToolkitCompat("range"),
      "es-toolkit/compat/sortBy": esToolkitCompat("sortBy"),
      "es-toolkit/compat/sumBy": esToolkitCompat("sumBy"),
      "es-toolkit/compat/throttle": esToolkitCompat("throttle"),
      "es-toolkit/compat/uniqBy": esToolkitCompat("uniqBy"),
    },
  },
});
