# @sheplu/tsconfig

Reusable, fully-descriptive TypeScript 6 `tsconfig` bases.

Every non-deprecated compiler option is listed **explicitly**, even when the value matches the TypeScript 6 default, so extending a config tells you at a glance exactly what is enforced — no hidden defaults, no guessing which flag changed between TS versions.

## Why

Most shared tsconfigs set only a handful of "interesting" fields and inherit the rest from TypeScript's defaults. That is compact, but the defaults change between versions (TS 6 flipped `strict`, `module`, `target`, `noUncheckedSideEffectImports`, and more), so two years from now you can't tell whether a flag is deliberate or just what the compiler happened to default to.

This package takes the opposite stance: the base is long on purpose. If a flag is in the file, a human chose its value.

## Requirements

- TypeScript `^6.0.0` (peer dependency — TS 6 removed `outFile`, `moduleResolution: classic`, and `amd`/`umd`/`systemjs`/`none` module kinds, which this package relies on being gone)

## Install

```sh
npm install --save-dev @sheplu/tsconfig typescript
```

## Variants

| Variant    | Extends   | `target` | `lib`                         | `module`   | `moduleResolution` | Emits       | Use for                                                             |
| ---------- | --------- | -------- | ----------------------------- | ---------- | ------------------ | ----------- | ------------------------------------------------------------------- |
| `base`     | —         | es2025   | es2025                        | nodenext   | nodenext           | yes         | Starting point for custom variants                                  |
| `node`     | base      | es2025   | es2025                        | nodenext   | nodenext           | yes         | Node.js libraries, services, CLIs (build → `dist/`)                 |
| `native`   | node      | es2025   | es2025                        | nodenext   | nodenext           | **no**      | Projects run directly by `node --experimental-strip-types` / bun / tsx — no build step |
| `browser`  | base      | es2022   | es2025 + dom + dom.iterable   | preserve   | bundler            | yes         | Browser apps processed by a bundler (Vite, esbuild, webpack, Rollup) |
| `react`    | browser   | es2022   | es2025 + dom + dom.iterable   | preserve   | bundler            | yes         | React apps (automatic JSX runtime, `jsxImportSource: react`)        |

## Quick start

### Node library (emits `dist/`)

```jsonc
{
  "extends": "@sheplu/tsconfig/node",
  "include": ["src/**/*"],
  "exclude": ["${configDir}/dist", "${configDir}/coverage"],
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

### Native TS execution (no build step, relative imports end in `.ts`)

```jsonc
{
  "extends": "@sheplu/tsconfig/native",
  "include": ["src/**/*.ts"],
  "exclude": ["${configDir}/dist", "${configDir}/coverage"]
}
```

Run it directly:

```sh
node --experimental-strip-types src/index.ts
# or
bun src/index.ts
# or
tsx src/index.ts
```

### Browser app with a bundler

```jsonc
{
  "extends": "@sheplu/tsconfig/browser",
  "include": ["src/**/*"],
  "compilerOptions": {
    "outDir": "dist"
  }
}
```

### React app

```jsonc
{
  "extends": "@sheplu/tsconfig/react",
  "include": ["src/**/*"],
  "compilerOptions": {
    "outDir": "dist",
    "types": ["react", "react-dom"]
  }
}
```

## What the base enforces

Quality / security / best-practice checks turned on in `base` (and therefore in every variant):

- **All strict checks** — `strict: true` plus every individual `strict*` flag explicitly set, so nothing relies on a future default change
- **Extra soundness** — `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `useUnknownInCatchVariables`
- **Hygiene** — `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `allowUnreachableCode: false`, `allowUnusedLabels: false`
- **Module safety** — `isolatedModules` + `verbatimModuleSyntax` (forces explicit `import type`, keeps files transpilable by swc/esbuild/Node's strip-types), `moduleDetection: force`, `noUncheckedSideEffectImports`, `forceConsistentCasingInFileNames`
- **Emit safety** — `noEmitOnError: true`, `stripInternal: true`, declarations + source maps on by default

## What each variant adds on top

### `node`

- `target: es2025`, `lib: ["es2025"]`
- `module: nodenext`, `moduleResolution: nodenext` — honors `package.json#type` and the `exports`/`imports` fields
- `types: ["node"]` — note you still need to `npm install -D @types/node`

### `native`

Extends `node` and flips the emit-related flags so tsc acts as a pure type-checker:

| Flag | Value | Why |
| --- | --- | --- |
| `noEmit` | `true` | No build step — the runtime strips types |
| `allowImportingTsExtensions` | `true` | Source files write `./foo.ts` directly |
| `rewriteRelativeImportExtensions` | `true` | If you ever *do* emit, rewrites `./foo.ts` → `./foo.js` |
| `erasableSyntaxOnly` | `true` | Forbids TS syntax Node's `--experimental-strip-types` can't erase (enums, namespaces, parameter properties, `import =`) |
| `sourceMap`, `declaration`, `declarationMap` | `false` | Redundant when nothing is emitted |

Use this when your app is run by `node --experimental-strip-types`, `bun`, `tsx`, or `ts-node` — i.e. you never ship compiled `.js`.

### `browser`

- `target: es2022` (widely supported by evergreen browsers without polyfills)
- `lib: ["es2025", "dom", "dom.iterable"]`
- `module: preserve`, `moduleResolution: bundler` — tells tsc "a bundler owns the module system, just type-check"

### `react`

Extends `browser` and turns on the automatic JSX runtime:

- `jsx: react-jsx`
- `jsxImportSource: react`

No need for classic-runtime options (`jsxFactory`, `jsxFragmentFactory`, `reactNamespace`) — they're deprecated and omitted by design.

## What is intentionally omitted

The base leaves these alone because they are not shareable:

- **Project-local paths** (you set these in your own `tsconfig.json`): `baseUrl`, `rootDir`, `outDir`, `declarationDir`, `tsBuildInfoFile`, `mapRoot`, `sourceRoot`, `files`, `include`, `exclude`, `references`
- **Deprecated / removed in TS 6**: `charset`, `importsNotUsedAsValues`, `keyofStringsOnly`, `noImplicitUseStrict`, `noStrictGenericChecks`, `out`, `outFile`, `preserveValueImports`, `suppressExcessPropertyErrors`, `suppressImplicitAnyIndexErrors`, `downlevelIteration`, `reactNamespace`, `jsxFactory`, `jsxFragmentFactory`
- **Runtime diagnostics / watch tuning** (CLI flags, not shareable policy): `diagnostics`, `explainFiles`, `extendedDiagnostics`, `generateCpuProfile`, `generateTrace`, `listEmittedFiles`, `listFiles`, `noCheck`, `traceResolution`, `watchOptions`, `typeAcquisition`

## Common overrides

Whatever the variant, these belong in your own `tsconfig.json` and not in the shared base:

| Option | Typical value | Why |
| --- | --- | --- |
| `include` | `["src/**/*"]` | Which files are part of the program |
| `exclude` | `["${configDir}/dist", "${configDir}/coverage"]` | `${configDir}` (TS 5.5+) resolves relative to the tsconfig that declares it |
| `outDir` | `"dist"` | Where `.js` is emitted |
| `rootDir` | `"src"` | Controls the layout inside `outDir` |
| `types` | `["node", "vitest", ...]` | The base leaves this empty to avoid pulling in unwanted ambient types |
| `paths` | your alias map | Project-local aliases |

## Opting out

### Pure-ESM codebase? You can drop `esModuleInterop`

The base sets `esModuleInterop: true` because it's needed whenever you import a CommonJS module using default-import syntax. If your project is fully ESM and uses `verbatimModuleSyntax` (which it inherits from the base), you can safely override:

```jsonc
{
  "extends": "@sheplu/tsconfig/node",
  "compilerOptions": {
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": false
  }
}
```

### Need to pin a specific Node version

The base uses `module: nodenext` / `moduleResolution: nodenext`, which tracks the current Node LTS. To pin behavior to a specific release, override per-project:

```jsonc
{
  "extends": "@sheplu/tsconfig/node",
  "compilerOptions": {
    "module": "node20",
    "moduleResolution": "node20"
  }
}
```

## Validating the configs locally

```sh
npm test
```

Runs `tsc --noEmit` against a small fixture for each variant, ensuring every option in every file is valid under the installed TypeScript version.
