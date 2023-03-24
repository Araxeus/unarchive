import { fileTypeFromFile } from 'file-type';
import compressing from 'compressing';
import { removeExtension } from './utils.js';

export async function unarchive(input: string, dest?: string) {
    const type = await fileTypeFromFile(input);
    dest ||= removeExtension(input);

    switch (type?.ext) {
        case 'tar':
            await compressing.tar.uncompress(input, dest);
            break;
        case 'gz':
            await compressing.tgz.uncompress(input, dest);
            break;
        case 'zip':
        default:
            try {
                await compressing.zip.uncompress(input, dest);
            } catch (e) {
                console.error(e);
                throw new Error(`Unknown file type for ${input}`);
            }
    }
}
