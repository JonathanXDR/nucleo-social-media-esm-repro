# nucleo-social-media ESM import failure

Minimal reproduction for a packaging defect in the `nucleo-social-media` npm package. The published package cannot be imported under Node's native ESM loader because its entry file re-exports a relative module without a file extension.

## Summary

`nucleo-social-media` declares `"type": "module"`, and its `dist/index.js` starts with:

```js
export * from './components/Icon';
```

The target file is `dist/components/Icon.js`, but the specifier omits the `.js` extension. Node's ESM resolver requires explicit extensions for relative specifiers, so importing the package throws `ERR_MODULE_NOT_FOUND`. Every published version (1.0.0, 1.0.1, 1.0.2) is affected. The sibling React packages such as `nucleo-glass` correctly emit `export * from './components/Icon.js';` and import fine, so this is specific to `nucleo-social-media`.

Bundlers and Bun resolve the extensionless specifier leniently, which hides the defect during development. Plain Node ESM does not, which breaks install scripts, server side rendering, and any direct Node import.

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

The package build is `tsc --outDir dist --module esnext` over TypeScript source that uses extensionless relative imports. TypeScript does not add or rewrite extensions on those specifiers, so the emitted ESM keeps the bare `./components/Icon`, which Node cannot resolve.

## Suggested fix

Add the `.js` extension to the relative re-exports in the source so the emitted file reads `export * from './components/Icon.js';`, matching `nucleo-glass` and the other React packages. Alternatively set `"module": "nodenext"` and `"moduleResolution": "nodenext"` in the build `tsconfig`, which makes TypeScript require explicit extensions and surfaces the problem at compile time.

## Environment

- Node.js 24.17.0 (reproduces on any Node version)
- npm 11.17.0
- nucleo-social-media 1.0.2
