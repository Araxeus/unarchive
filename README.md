# unarchive

This tool is a utility wrapper around the [compressing](https://www.npmjs.com/package/compressing) package

it automatically detects the compression type and extracts the archive

## Installation

```bash
npm install unarchive
```

or

```bash
yarn add unarchive
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
