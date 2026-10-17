// Bundles src/native.js (Capacitor plugin bridge) and copies the web page into www/
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";

const VERSION = process.env.APP_VERSION || "0";
const STORE = process.env.STORE_BUILD === "1" ? "1" : "0"; // store builds never self-update

mkdirSync("www", { recursive: true });
await build({
  entryPoints: ["src/native.js"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "chrome90",
  outfile: "www/native.js",
});
let html = readFileSync("src/index.html", "utf8");
html = html.replace("__APP_VERSION__", VERSION).replace("__STORE_BUILD__", STORE);
writeFileSync("www/index.html", html);
copyFileSync("src/i18n.js", "www/i18n.js");
console.log("Built www/ (version " + VERSION + ", store build: " + STORE + ")");
