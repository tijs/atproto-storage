import { build, emptyDir } from "jsr:@deno/dnt@0.42.3";

const denoJson = JSON.parse(Deno.readTextFileSync("./deno.json"));

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  shims: {},
  test: false,
  filterDiagnostic(diagnostic) {
    const fileName = diagnostic.file?.fileName;
    if (fileName && fileName.includes("@std/assert")) return false;
    if (fileName && fileName.includes("deno-kv")) return false;
    return true;
  },
  compilerOptions: {
    lib: ["ES2022", "DOM"],
  },
  package: {
    name: "@tijs/atproto-storage",
    version: denoJson.version,
    description:
      "Storage implementations for AT Protocol OAuth applications. Simple key-value interface with in-memory and SQLite backends.",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/tijs/atproto-storage.git",
    },
    keywords: ["atproto", "bluesky", "oauth", "storage", "sqlite"],
  },
  postBuild() {
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
