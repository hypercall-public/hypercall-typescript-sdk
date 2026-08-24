# Contributing to @hypercallxyz/sdk

## Development Setup

1. Install [Deno](https://deno.com).
2. Use the Deno language server in your editor.
3. Run local checks before opening a PR.

```bash
deno task check
deno task test
deno task pack:npm
```

If Deno is not installed globally, use `npx -y deno` before each command.

## SDK Layout

- Source entrypoints are exported from `deno.json`.
- API clients live in `src/api/<domain>/client.ts`.
- Low-level request methods live in `src/api/<domain>/_methods/`.
- npm package output is generated into `dist/` and should not be committed.

## Adding an API Method

1. Add a method file under the relevant `_methods/` directory.
2. Export request schemas, parameter types, response types, and the low-level function.
3. Re-export the method from the domain `mod.ts`.
4. Add the matching client method.
5. Add tests for request validation and request shape.
6. Add a short runnable example when the method is a user-facing SDK surface.

## Publishing to npm

Publishing requires access to the public `@hypercall` npm scope and any authentication factor enforced by the npm
organization.

1. Set the release version in `deno.json` and update `CHANGELOG.md`.
2. Run `deno task check` and `deno task test`.
3. Inspect `deno task publish:npm:dry`.
4. Build the exact publish directory with `deno task build:npm`.
5. From `dist/`, run `npm publish --access public` only after release approval.

`NPM_PACKAGE_NAME` and `NPM_VERSION` can override the generated package identity for a dry run. Do not publish an
override that disagrees with `deno.json`.
