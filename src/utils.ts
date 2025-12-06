import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { Readable } from 'node:stream';

// Magic bytes constants
const ZIP_MAGIC = new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // PK..
const CRX_MAGIC = new Uint8Array([0x43, 0x72, 0x32, 0x34]); // Cr24

export function removeExtension(input: string) {
    const res = input.slice(0, input.lastIndexOf(extname(input)));
    return res.endsWith('.tar') ? res.slice(0, -4) : res;
}

export async function getFileBuffer(
    input: string | Buffer<ArrayBufferLike> | Readable,
): Promise<Buffer> {
    if (typeof input === 'string') {
        return await readFile(input);
    } else if (input instanceof Buffer) {
        return input;
    } else if (input instanceof Uint8Array) {
        return Buffer.from(input);
    } else if (input instanceof ArrayBuffer) {
        return Buffer.from(input);
    } else if (input instanceof Readable) {
        const chunks: Buffer[] = [];
        for await (const chunk of input) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }
    throw new Error('Invalid input type');
}

/**
 * Converts a CRX (Chrome extension) file buffer to a ZIP file buffer.
 *
 * If the input buffer is already a valid ZIP file (i.e., starts with the ZIP magic bytes),
 * the function returns the buffer unchanged. This makes the function idempotent and safe to call
 * on both CRX and ZIP buffers.
 *
 * @param {Buffer} buf - The input buffer, either a CRX or ZIP file.
 * @returns {Buffer} The ZIP file buffer.
 * @throws {Error} If the input is not a valid CRX or ZIP file.
 */
export function crxToZip(buf: Buffer): Buffer {
    if (buf.length < 12) {
        throw new Error('Invalid CRX: File too small');
    }

    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    const header = buf.subarray(0, 4);

    // Already a zip file
    if (header.every((byte, i) => byte === ZIP_MAGIC[i])) {
        return buf;
    }

    // Validate CRX magic header
    if (!header.every((byte, i) => byte === CRX_MAGIC[i])) {
        throw new Error(
            `Invalid CRX header: Expected Cr24 but found ${header.toString('hex')}`,
        );
    }

    const version = view.getUint32(4, true);
    if (version !== 2 && version !== 3) {
        throw new Error(
            `Unexpected CRX format version: ${version}. Only versions 2 and 3 are supported.`,
        );
    }

    const zipStartOffset =
        version === 2
            ? // v2: magic(4) + version(4) + pubKeyLen(4) + sigLen(4) + pubKey + sig
              16 + view.getUint32(8, true) + view.getUint32(12, true)
            : // v3: magic(4) + version(4) + headerSize(4) + header
              12 + view.getUint32(8, true);

    if (zipStartOffset >= buf.length) {
        throw new Error('Invalid CRX: ZIP data offset exceeds file size');
    }

    return buf.subarray(zipStartOffset);
}
