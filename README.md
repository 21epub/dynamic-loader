# @21epub/dynamic-loader

> Dynamic load module on demand for epub

[![NPM](https://img.shields.io/npm/v/@21epub/dynamic-loader.svg)](https://www.npmjs.com/package/@21epub/dynamic-loader) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Build Status](https://img.shields.io/travis/com/21epub/dynamic-loader)](https://travis-ci.com/github/21epub/dynamic-loader) [![Codecov](https://img.shields.io/codecov/c/github/21epub/dynamic-loader)](https://codecov.io/gh/21epub/dynamic-loader)

## Intro

Dynamic module loader to import module for webpack

TODO: Dynamic js or css loader

## Feature

- [x] Easy-to-use
- [x] Loader for webapck module
- [ ] Loader for online js or css

## Install

```bash
npm install --save @21epub/dynamic-loader
```

## Usage

```ts
  import { DynamicModuleLoader } from '@21epub/dynamic-loader'

  const loaders = [
      {
         modules: ["module1", "module2"],
         loader: async () => {
               await import('url/to/module1');
               await import('url/to/module2')
         }
      },
      {
         modules: 'module3',
         loader: async () => {
               await import('url/to/module3');
         }
      }
  ]

  const dynamicLoader = new DynamicModuleLoader(loaders)

  ...
  dynamicLoader.loadAll().then( callbacks => console.log(callbacks))

```

### [Documents](https://21epub.github.io/dynamic-loader/)

## Developing and running on localhost

First install dependencies and then install peerDeps for parcel dev:

```sh
npm install
npm run install-peers
```

To run Example in hot module reloading mode:

```sh
npm start
```

To create a bundle library module build:

```sh
npm run build
```

## Running

Open the file `dist/index.html` in your browser

## Testing

To run unit tests:

```sh
npm test
```

## License

MIT © [21epub](https://github.com/21epub)
