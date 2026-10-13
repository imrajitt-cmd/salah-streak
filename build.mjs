// Bundles src/native.js (Capacitor plugin bridge) and copies the web page into www/
import { build } from "esbuild";
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("www", { recursive: true });
await build({
  entryPoints: ["src/native.js"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "chrome90",
  outfile: "www/native.js",
});
copyFileSync("src/index.html", "www/index.html");
console.log("Built www/");
