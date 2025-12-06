import { normalize } from 'node:path';

export class FileTypeError extends Error {
    filetype: string | undefined;
    meme: string | undefined;
    filepath: string | undefined;

    constructor({
        filetype,
        meme,
        filepath,
    }: {
        filetype?: string;
        meme?: string;
        filepath?: string;
    } = {}) {
        super('Unsupported file type');
        this.name = 'FileTypeError';
        this.meme = meme;
        this.filetype = filetype;
        this.filepath = filepath ? normalize(filepath) : undefined;
    }
}
