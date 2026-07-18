export type AtomPathKey = string;

export class AtomPathParserComponent {
    public Parse(path: string): AtomPathKey[] {
        const parts = path.split("/").filter((part) => part.size() > 0);

        if (parts.size() === 0) {
            error(`Atom path "${path}" is empty.`);
        }

        return parts;
    }

    public Join(basePath: string, path?: string): string {
        if (path === undefined || path === "") {
            return basePath;
        }

        return `${basePath}/${path}`;
    }
}
