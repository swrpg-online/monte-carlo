const esbuild = require("esbuild");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Clean dist directory
if (fs.existsSync("./dist")) {
  fs.rmSync("./dist", { recursive: true });
}
fs.mkdirSync("./dist");

// First, compile TypeScript to get type definitions
console.log("Generating TypeScript declarations...");
execSync("tsc --emitDeclarationOnly", { stdio: "inherit" });

// Bundle the main entry point with all dependencies
console.log("Bundling with dependencies...");
esbuild.buildSync({
  entryPoints: ["./src/index.ts"],
  bundle: true,
  outfile: "./dist/index.js",
  platform: "node",
  target: "es2020",
  format: "cjs",
  // Bundle all dependencies including @swrpg-online/dice
  external: [],
  minify: false,
  sourcemap: true,
});

// Also create a bundled ES module version
console.log("Creating ES module bundle...");
esbuild.buildSync({
  entryPoints: ["./src/index.ts"],
  bundle: true,
  outfile: "./dist/index.esm.js",
  platform: "node",
  target: "es2020",
  format: "esm",
  // Bundle all dependencies including @swrpg-online/dice
  external: [],
  minify: false,
  sourcemap: true,
});

console.log("Build complete! The dist folder now contains:");
console.log("- index.js (CommonJS bundle with all dependencies)");
console.log("- index.esm.js (ES module bundle with all dependencies)");
console.log("- index.d.ts (TypeScript declarations)");
console.log(
  "\nThe package is now self-contained and can be used without installing dependencies.",
);
