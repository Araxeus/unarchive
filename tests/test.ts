import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';

import { unarchive } from '../index.js';
import { removeExtension } from '../utils.js';

const redBackground = (str: string) => `\x1b[41m${str}\x1b[0m`;
const greenBackground = (str: string) => `\x1b[42m${str}\x1b[0m`;
const greenText = (str: string) => `\x1b[32m${str}\x1b[0m`;

const fixtures = [
    'test-zip.zip',
    'test-tar.tar',
    'test-tgz1.tar.gz',
    'test-tgz2.tgz',
];

const fixturesPaths = fixtures.map((p) =>
    path.join(process.cwd(), 'tests', 'fixtures', p),
);

const dest = path.join(process.cwd(), 'tests', 'results');
for (const fixturePath of fixturesPaths) {
    await unarchive(fixturePath, dest);
    console.log(`Unarchived ${fixturePath} to ${dest}`);
}

const destPaths = fixtures.map((p) =>
    path.join(dest, `${removeExtension(p)}.txt`),
);

for (const destPath of destPaths) {
    const file = await readFile(destPath, 'utf-8');

    const expected = `hello from ${path.basename(destPath, '.txt')}`;
    if (file !== expected) {
        throw new Error(
            `File ${destPath} content is not correct\nExpected:\n${greenBackground(
                expected,
            )}\nActual:\n${redBackground(file)}`,
        );
    }
}

console.log(greenText('All tests passed'));
await rm(dest, { recursive: true, force: true });
