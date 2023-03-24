import { fileTypeFromFile } from 'file-type';
import compressing from 'compressing';
import { removeExtension } from './utils.js';
export async function unarchive(input, dest) {
    const type = await fileTypeFromFile(input);
    if (!type?.ext) {
        throw new Error(`Unknown file type for ${input}`);
    }
    dest ||= removeExtension(input);
    switch (type.ext) {
        case 'zip':
            await compressing.zip.uncompress(input, dest);
            break;
        case 'tar':
            await compressing.tar.uncompress(input, dest);
            break;
        case 'gz':
            await compressing.tgz.uncompress(input, dest);
            break;
        default:
            throw new Error(`Unknown file type for ${input}`);
    }
}
