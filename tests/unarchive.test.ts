import { afterAll, describe, expect, test } from 'bun:test';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { FileTypeError, unarchive } from '../src/index.js';
import { removeExtension } from '../src/utils.js';

const testsDir = path.join(process.cwd(), 'tests');
const goodFixturesPath = path.join(testsDir, 'fixtures', 'good');
const badFixturesPath = path.join(testsDir, 'fixtures', 'bad');
const fixtures = await readdir(goodFixturesPath);
const dest = path.join(testsDir, 'results');

describe.each(fixtures)('%#: Unarchive %s', async (fixture) => {
    const fixturePath = path.join(goodFixturesPath, fixture);
    test('should unarchive with no errors', async () => {
        await unarchive(fixturePath, dest);
    });

    test('should create the expected file with correct content', async () => {
        const destPath = path.join(
            dest,
            `${removeExtension(path.basename(fixturePath))}.txt`,
        );
        const file = await Bun.file(destPath).text();
        const expected = `hello from ${path.basename(destPath, '.txt')}`;
        expect(file).toBe(expected);
    });
});

test('should throw if CRX file too small', async () => {
    const smallCrx = Buffer.from([
        0x43, 0x72, 0x32, 0x34, 0x00, 0x00, 0x00, 0x00,
    ]);
    expect(async () => {
        await unarchive(smallCrx, path.join(dest, 'crx-too-small'));
    }).toThrow('Invalid CRX: File too small');
});

test('should throw if crx version number is malformed', async () => {
    const malformedCrxV = path.join(badFixturesPath, 'crx-malformed-v.crx');
    expect(async () => {
        await unarchive(malformedCrxV, path.join(dest, 'crx-malformed-v'));
    }).toThrow(
        'Unexpected CRX format version: 0. Only versions 2 and 3 are supported.',
    );
});

test('should throw if unsupported file type', async () => {
    const unsupportedFile = path.join(badFixturesPath, 'test-7z.7z');
    expect(async () => {
        await unarchive(unsupportedFile, path.join(dest, 'test-7z'));
    }).toThrow(FileTypeError);
});

afterAll(async () => {
    await rm(dest, { recursive: true, force: true });
});
