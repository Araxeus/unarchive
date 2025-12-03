import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

export function removeExtension(input: string) {
    const res = input.slice(0, input.lastIndexOf(path.extname(input)));
    return res.endsWith('.tar') ? res.slice(0, -4) : res;
}

export async function getFileBuffer(
    input: string | Buffer | NodeJS.ReadableStream,
): Promise<Buffer> {
    if (typeof input === 'string') {
        return await readFile(input);
    } else if (input instanceof Buffer) {
        return input;
    } else if (input instanceof Readable) {
        const chunks: Buffer[] = [];
        for await (const chunk of input) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }
    throw new Error('Invalid input type');
}

// Credits for the original function go to Rob--W
// https://github.com/Rob--W/crxviewer/blob/master/src/lib/crx-to-zip.js
export function crxToZip(buf: Buffer): Buffer {
    function calcLength(a: number, b: number, c: number, d: number) {
        let length = 0;

        length += a << 0;
        length += b << 8;
        length += c << 16;
        length += (d << 24) >>> 0;
        return length;
    }

    // 50 4b 03 04
    // This is actually a zip file
    if (buf[0] === 80 && buf[1] === 75 && buf[2] === 3 && buf[3] === 4) {
        return buf;
    }

    // 43 72 32 34 (Cr24)
    if (buf[0] !== 67 || buf[1] !== 114 || buf[2] !== 50 || buf[3] !== 52) {
        throw new Error('Invalid header: Does not start with Cr24');
    }

    // 02 00 00 00
    // or
    // 03 00 00 00
    const isV3 = buf[4] === 3;
    const isV2 = buf[4] === 2;

    if ((!isV2 && !isV3) || buf[5] || buf[6] || buf[7]) {
        throw new Error('Unexpected crx format version number.');
    }

    if (isV2) {
        const publicKeyLength = calcLength(buf[8], buf[9], buf[10], buf[11]);
        const signatureLength = calcLength(buf[12], buf[13], buf[14], buf[15]);

        // 16 = Magic number (4), CRX format version (4), lengths (2x4)
        const zipStartOffset = 16 + publicKeyLength + signatureLength;

        return buf.slice(zipStartOffset, buf.length);
    }
    // v3 format has header size and then header
    const headerSize = calcLength(buf[8], buf[9], buf[10], buf[11]);
    const zipStartOffset = 12 + headerSize;

    return buf.slice(zipStartOffset, buf.length);
}
