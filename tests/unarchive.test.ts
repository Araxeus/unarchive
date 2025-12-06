import { afterAll, describe, expect, test } from 'bun:test';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { unarchive } from '../index.js';
import { removeExtension } from '../utils.js';

const testsDir = path.join(process.cwd(), 'tests');

const fixtures = await readdir(path.join(testsDir, 'fixtures'));

const dest = path.join(testsDir, 'results');
describe.each(fixtures)('%#: Unarchive %s', (fixture) => {
    const fixturePath = path.join(testsDir, 'fixtures', fixture);
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

afterAll(async () => {
    await rm(dest, { recursive: true, force: true });
});
