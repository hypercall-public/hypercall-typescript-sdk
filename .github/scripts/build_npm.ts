// deno-lint-ignore-file no-import-prefix

/**
 * Builds the Deno source package into an ESM-only npm package.
 *
 * - deno.json is the source manifest
 * - dist/ is only the npm publish staging directory
 * - runtime JS and declarations live under dist/esm/
 *
 * @example
 * ```sh
 * deno run -A .github/scripts/build_npm.ts
 * ```
 */

import { build } from "jsr:@nktkas/dtn@^1";
import denoJson from "../../deno.json" with { type: "json" };

type DenoJson = typeof denoJson & {
  name: string;
  version: string;
};

function env(name: string): string | undefined {
  const value = Deno.env.get(name)?.trim();
  return value ? value : undefined;
}

async function existingFiles(paths: string[]): Promise<string[]> {
  const files: string[] = [];
  for (const path of paths) {
    try {
      const stat = await Deno.stat(path);
      if (stat.isFile) files.push(path);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  return files;
}

if (import.meta.main) {
  const publishManifest = structuredClone(denoJson) as DenoJson;

  publishManifest.name = env("NPM_PACKAGE_NAME") ?? publishManifest.name;
  publishManifest.version = env("NPM_VERSION") ?? publishManifest.version;

  await Deno.remove("dist", { recursive: true }).catch((error) => {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  });

  await build({
    outDir: "dist",
    denoJson: publishManifest,
    npmReplacements: {
      "@valibot/valibot": "valibot",
    },
    packageJson: {
      description: "TypeScript SDK for Hypercall.",
      keywords: [
        "api",
        "library",
        "sdk",
        "javascript",
        "typescript",
        "trading",
        "options",
        "derivatives",
        "hypercall",
      ],
      homepage: "https://github.com/hypercall-public/hypercall-typescript-sdk",
      bugs: { url: "https://github.com/hypercall-public/hypercall-typescript-sdk/issues" },
      repository: {
        type: "git",
        url: "git+https://github.com/hypercall-public/hypercall-typescript-sdk.git",
      },
      license: "MIT",
      sideEffects: false,
      engines: { node: ">=22.12.0" },
      publishConfig: { access: "public" },
    },
    copyFiles: await existingFiles(["README.md", "LICENSE", "CHANGELOG.md", "CONTRIBUTING.md", "SECURITY.md"]),
  });
}
