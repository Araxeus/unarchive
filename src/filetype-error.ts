import { normalize } from 'node:path';

export class FileTypeError extends Error {
    filetype: string | undefined;
    mime: string | undefined;
    filepath: string | undefined;

    constructor({
        filetype,
        mime,
        filepath,
    }: {
        filetype?: string;
        mime?: string;
        filepath?: string;
    } = {}) {
        super('Unsupported file type');
        this.name = 'FileTypeError';
        this.mime = mime;
        this.filetype = filetype;
        this.filepath = filepath ? normalize(filepath) : undefined;
    }
}
