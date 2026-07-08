import { defineConfig } from "tsup";

export default defineConfig({
  entry: { "search-sidecar": "src/sidecar/main.ts" },
  format: ["cjs"],
  target: "node22",
  platform: "node",
  clean: false,
  sourcemap: false,
  dts: false,
  splitting: false,
  shims: true,
  minify: true,
  outDir: "dist",
  outExtension: () => ({ js: ".cjs" }),
  banner: { js: "#!/usr/bin/env node" },
  noExternal: [/.*/],
});
