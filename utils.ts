import path from 'node:path';

export function removeExtension(input: string) {
    const res = input.slice(0, input.lastIndexOf(path.extname(input)));
    return res.endsWith('.tar') ? res.slice(0, -4) : res;
}
