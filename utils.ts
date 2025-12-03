import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

// Magic bytes constants
const ZIP_MAGIC = new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // PK..
const CRX_MAGIC = new Uint8Array([0x43, 0x72, 0x32, 0x34]); // Cr24

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
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    const header = buf.subarray(0, 4);

    // Already a zip file
    if (header.every((byte, i) => byte === ZIP_MAGIC[i])) {
        return buf;
    }

    // Validate CRX magic header
    if (!header.every((byte, i) => byte === CRX_MAGIC[i])) {
        throw new Error('Invalid header: Does not start with Cr24');
    }

    const version = view.getUint32(4, true);
    if (version !== 2 && version !== 3) {
        throw new Error('Unexpected crx format version number.');
    }

    const zipStartOffset =
        version === 2
            ? // v2: magic(4) + version(4) + pubKeyLen(4) + sigLen(4) + pubKey + sig
              16 + view.getUint32(8, true) + view.getUint32(12, true)
            : // v3: magic(4) + version(4) + headerSize(4) + header
              12 + view.getUint32(8, true);

    return buf.subarray(zipStartOffset);
}
