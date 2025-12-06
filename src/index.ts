import { Readable } from 'node:stream';
import compressing from 'compressing';
import {
    fileTypeFromBuffer,
    fileTypeFromFile,
    fileTypeFromStream,
} from 'file-type';
import { FileTypeError } from './filetype-error.js';
import { crxToZip, getFileBuffer, removeExtension } from './utils.js';

export { FileTypeError } from './filetype-error.js';

export async function unarchive(
    input: string | Buffer | Readable,
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
            await compressing.gzip.uncompress(
                input as compressing.sourceType,
                dest,
            );
            break;
        case 'tar.gz':
            await compressing.tgz.uncompress(
                input as compressing.sourceType,
                dest,
            );
            break;
        case 'crx': {
            const crxBuff = await getFileBuffer(input);
            const zipBuffer = crxToZip(crxBuff);
            await compressing.zip.uncompress(zipBuffer, dest);
            break;
        }
        // biome-ignore lint/complexity/noUselessSwitchCase: for clarity
        case 'zip':
        default:
            try {
                await compressing.zip.uncompress(
                    input as compressing.sourceType,
                    dest,
                );
            } catch {
                throw new FileTypeError({
                    filetype: type?.ext,
                    mime: type?.mime,
                    filepath: typeof input === 'string' ? input : undefined,
                });
            }
    }
}

async function getFileType(input: string | Buffer | Readable) {
    if (typeof input === 'string') {
        return fileTypeFromFile(input);
    }
    if (input instanceof Buffer) {
        return fileTypeFromBuffer(input as Uint8Array);
    }

    if (input instanceof Readable) {
        return fileTypeFromStream(input as Readable);
    }
    return undefined;
}
