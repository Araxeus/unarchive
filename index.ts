import type { Readable } from 'node:stream';
import compressing from 'compressing';
import {
    fileTypeFromBuffer,
    fileTypeFromFile,
    fileTypeFromStream,
} from 'file-type';
import { removeExtension } from './utils.js';

export async function unarchive(
    input: string | Buffer | NodeJS.ReadableStream,
    dest?: string,
) {
    const type = await getFileType(input);

    if (!dest) {
        if (typeof input === 'string') {
            dest ||= removeExtension(input);
        } else {
            throw new Error(
                'Destination path is required for streams or buffers',
            );
        }
    }

    switch (type?.ext) {
        case 'tar':
            await compressing.tar.uncompress(
                input as compressing.sourceType,
                dest,
            );
            break;
        case 'gz':
            await compressing.tgz.uncompress(
                input as compressing.sourceType,
                dest,
            );
            break;
        // biome-ignore lint/complexity/noUselessSwitchCase: for clarity
        case 'zip':
        default:
            try {
                await compressing.zip.uncompress(
                    input as compressing.sourceType,
                    dest,
                );
            } catch (e) {
                console.error(e);
                throw new Error(`Unknown file type for ${input}`);
            }
    }
}

async function getFileType(
    input:
        | string
        | Uint8Array
        | ArrayBuffer
        | Buffer
        | Readable
        | NodeJS.ReadableStream,
) {
    if (typeof input === 'string') {
        return fileTypeFromFile(input);
    }
    if (
        input instanceof Uint8Array ||
        input instanceof ArrayBuffer ||
        input instanceof Buffer
    ) {
        return fileTypeFromBuffer(input);
    }

    return fileTypeFromStream(input as Readable);
}
