# unarchive

This tool is a utility wrapper around the [compressing](https://www.npmjs.com/package/compressing) package

it automatically detects the compression type (zip/tar/tar.gz/gz/crx/xpi) and extracts the content of the archive

## Installation

```bash
npm install unarchive
```

or

```bash
yarn add unarchive
pnpm add unarchive
bun add unarchive
```

## Usage

```js
//const unarchive = require('unarchive')
import unarchive from 'unarchive'

await unarchive(archiveName, 'outputFolder')
```

## Supported formats

- zip
- tar
- tar.gz / tgz
- xpi (Firefox extension files)
- crx (Chrome extension files)
