import { build } from "esbuild";
import { rm, writeFile } from "node:fs/promises";

async function buildStyles() {
  const result = await build({
    entryPoints: ["src/styles.js"],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    loader: {
      ".css": "text",
      ".woff2": "dataurl",
    },
    logLevel: "silent",
  });
  const source = result.outputFiles[0].text;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  const { styles } = await import(moduleUrl);

  await writeFile("dist/styles.css", styles);
}

await rm("dist", { recursive: true, force: true });
await build({
  entryPoints: ["src/main.js"],
  outdir: "dist",
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
  entryNames: "[name]",
  logLevel: "info",
});
await buildStyles();
