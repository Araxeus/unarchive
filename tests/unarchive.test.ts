import { afterAll, describe, expect, test } from 'bun:test';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { FileTypeError, unarchive } from '../src/index.js';
import { CRX_MAGIC, crxToZip, removeExtension } from '../src/utils.js';

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
    const smallCrx = Buffer.from([...CRX_MAGIC, 0x02, 0x00, 0x00, 0x00]);
    expect(async () => {
        await unarchive(smallCrx, path.join(dest, 'crx-too-small'));
    }).toThrow('Invalid CRX: File too small');
});

test('should throw if CRX header is invalid', async () => {
    // Invalid magic header (not Cr24)
    const invalidHeader = Buffer.from([
        0x00,
        0x01,
        0x00,
        0x00, // Invalid magic
        0x02,
        0x00,
        0x00,
        0x00, // version 2
        0x00,
        0x00,
        0x00,
        0x00, // pubKeyLen
        0x01,
        0x00,
        0x00,
        0x01, // sigLen
    ]);
    expect(async () => {
        // using crxToZip directly for this test because
        // file-type from unarchive won't recognize it as CRX, thus should never reach this point
        crxToZip(invalidHeader);
    }).toThrow('Invalid CRX header: Expected Cr24 but found 00010000');
});

test('should throw if CRX v2 file too small to contain header lengths', async () => {
    // CRX v2 header: magic(4) + version(4) + pubKeyLen(4) + sigLen(4) = 16 bytes minimum
    // This buffer has magic + version 2 + pubKeyLen, but is missing sigLen (only 12 bytes)
    const smallCrxV2 = Buffer.from([
        ...CRX_MAGIC,
        0x02,
        0x00,
        0x00,
        0x00, // version 2 (little-endian)
        0x00,
        0x00,
        0x00,
        0x00, // pubKeyLen (4 bytes, but sigLen missing)
    ]);
    expect(async () => {
        await unarchive(smallCrxV2, path.join(dest, 'crx-v2-too-small'));
    }).toThrow('Invalid CRX v2: File too small to contain header lengths');
});

test('should throw if crx has unsupported version number', async () => {
    const malformedCrxV = path.join(badFixturesPath, 'crx-malformed-v.crx');
    expect(async () => {
        await unarchive(malformedCrxV, path.join(dest, 'crx-malformed-v'));
    }).toThrow(
        'Unexpected CRX format version: 0. Only versions 2 and 3 are supported.',
    );
    const malformedCrxV3 = Buffer.from([
        ...CRX_MAGIC,
        0x62,
        0x75,
        0x66,
        0x66,
        0x65,
        0x72,
        0x73,
        0x21, // version 'buffers!' in ASCII (little-endian 1717990754)
    ]);
    expect(async () => {
        await unarchive(malformedCrxV3, path.join(dest, 'crx-malformed-v3'));
    }).toThrow(
        'Unexpected CRX format version: 1717990754. Only versions 2 and 3 are supported.',
    );
});

test('should throw if CRX ZIP offset exceeds file size', async () => {
    // CRX v2 with pubKeyLen and sigLen that exceed the actual buffer size
    const crxWithBadOffset = Buffer.from([
        ...CRX_MAGIC,
        0x02,
        0x00,
        0x00,
        0x00, // version 2 (little-endian)
        0xff,
        0x00,
        0x00,
        0x00, // pubKeyLen = 255
        0xff,
        0x00,
        0x00,
        0x00, // sigLen = 255
        // No actual data - offset would be 16 + 255 + 255 = 526, but buffer is only 16 bytes
    ]);
    expect(async () => {
        await unarchive(crxWithBadOffset, path.join(dest, 'crx-bad-offset'));
    }).toThrow('Invalid CRX: ZIP data offset exceeds file size');
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
