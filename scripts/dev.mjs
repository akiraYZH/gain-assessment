import { context } from "esbuild";

const devContext = await context({
  entryPoints: ["src/main.js"],
  outfile: "dist/main.js",
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  loader: {
    ".css": "text",
    ".woff2": "dataurl",
  },
  minify: false,
  sourcemap: false,
  treeShaking: true,
  legalComments: "inline",
  logLevel: "info",
});

await devContext.watch();
console.log("Watching src files and rebuilding dist/main.js...");

async function stopWatcher() {
  await devContext.dispose();
  process.exit(0);
}

process.once("SIGINT", stopWatcher);
process.once("SIGTERM", stopWatcher);
