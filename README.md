# nucleo-social-media ESM import failure

Minimal reproduction for a packaging defect in the `nucleo-social-media` npm package. The published package cannot be imported under Node's native ESM loader because its entry file re-exports a relative module without a file extension.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/JonathanXDR/nucleo-social-media-esm-repro)

Opening the StackBlitz link installs the package and runs the reproduction automatically, no Nucleo license required.

## Summary

`nucleo-social-media` declares `"type": "module"`, and its `dist/index.js` starts with:

```js
export * from './components/Icon';
```

The target file is `dist/components/Icon.js`, but the specifier omits the `.js` extension. Node's ESM resolver requires explicit extensions for relative specifiers, so importing the package throws `ERR_MODULE_NOT_FOUND`. Every published version (1.0.0, 1.0.1, 1.0.2) is affected.

Bundlers and Bun resolve the extensionless specifier leniently, which hides the defect during development. Plain Node ESM does not, which breaks install scripts, server side rendering, and any direct Node import.

## This is a one-off, not a build-system issue

All 21 Nucleo React packages are built with the identical script (`tsc --outDir dist --module esnext`). Importing each one under Node gives:

| Result | Packages |
| --- | --- |
| imports OK | 20 packages, including `nucleo-glass`, `nucleo-arcade`, `nucleo-flags`, `nucleo-core-outline-24`, ... |
| `ERR_MODULE_NOT_FOUND` | `nucleo-social-media` only |

The 20 working packages emit `export * from './components/Icon.js';` (with the extension). Only `nucleo-social-media` emits it without. Because `tsc --module esnext` copies relative specifiers through verbatim and never adds or strips extensions, the difference is a single missing `.js` in this one package's source, inconsistent with the other 20.

## Reproduce with the real package

No Nucleo license is required. The defect is in the public tarball, and `.npmrc` sets `ignore-scripts=true` so the license preinstall is skipped.

```bash
npm install
npm run reproduce
```

Expected output:

```
REPRODUCED: importing "nucleo-social-media" failed under Node v24.x.
  code:    ERR_MODULE_NOT_FOUND
  message: Cannot find module '.../nucleo-social-media/dist/components/Icon' imported from '.../nucleo-social-media/dist/index.js'
```

## Reproduce the mechanism without any dependency

The `mechanism/` folder is a tiny self contained package that mirrors the exact structure. `broken.js` omits the extension and fails, `fixed.js` adds it and works.

```bash
npm run mechanism
```

Expected output:

```
broken (no extension): ERR_MODULE_NOT_FOUND
fixed  (with .js)    : imported OK
```

## Root cause

The package build is `tsc --outDir dist --module esnext` over TypeScript source that uses an extensionless relative import. TypeScript does not add or rewrite extensions on those specifiers, so the emitted ESM keeps the bare `./components/Icon`, which Node cannot resolve.

## Suggested fix

Add the `.js` extension to the relative re-export in the source so the emitted file reads `export * from './components/Icon.js';`, matching the other 20 React packages. Alternatively set `"module": "nodenext"` and `"moduleResolution": "nodenext"` in the build `tsconfig`, which makes TypeScript require explicit extensions and surfaces the problem at compile time.

## Environment

- Node.js 24.17.0 (reproduces on any Node version)
- npm 11.17.0
- nucleo-social-media 1.0.2
