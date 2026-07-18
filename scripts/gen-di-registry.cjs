/* gen-di-registry.cjs — игнорируем папку Singletons в пути */
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = process.cwd();

const targets = [
    {
        providersRoot: "src/server/DI/Providers/Server",
        outFile: "src/server/DI/Generated/ServerRegistry.ts",
        typeName: "ServerRegistry",
    },
    {
        providersRoot: "src/shared/DI/Providers/Shared",
        outFile: "src/shared/DI/Generated/SharedRegistry.ts",
        typeName: "SharedRegistry",
    },
];

function walkForTokens(dir, base = "") {
    const files = [];
    for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name);
        const rel = path.join(base, name);
        if (fs.statSync(p).isDirectory()) {
            files.push(...walkForTokens(p, rel));
        } else if (p.endsWith("Token.ts")) {
            files.push(rel);
        }
    }
    return files;
}

function pascal(input) {
    return input
        .split(/[-_]+/g)
        .filter(Boolean)
        .map((p) => (p.toUpperCase() === p ? p : p[0].toUpperCase() + p.slice(1)))
        .join("");
}

function setTree(tree, pathParts, alias) {
    let cur = tree;
    for (let i = 0; i < pathParts.length - 1; i++) {
        const k = pathParts[i];
        if (!cur[k] || typeof cur[k] !== "object") cur[k] = {};
        cur = cur[k];
    }
    const last = pathParts[pathParts.length - 1];
    if (cur[last] !== undefined) throw new Error(`Duplicate registry path: ${pathParts.join(".")}`);
    cur[last] = alias;
}

function emitObject(tree, indent = 0) {
    const pad = "  ".repeat(indent);
    const entries = Object.entries(tree).sort(([a], [b]) => a.localeCompare(b));
    return `{\n${entries
        .map(([k, v]) => {
            if (typeof v === "string") return `${pad}  ${k}: ${v},`;
            return `${pad}  ${k}: ${emitObject(v, indent + 1)},`;
        })
        .join("\n")}\n${pad}}`;
}

for (const t of targets) {
    const providersRootAbs = path.join(PROJECT_ROOT, t.providersRoot);
    if (!fs.existsSync(providersRootAbs)) continue;

    const outAbs = path.join(PROJECT_ROOT, t.outFile);
    const outDir = path.dirname(outAbs);

    const tokenFiles = walkForTokens(providersRootAbs);
    const tree = {};
    const imports = [];
    let idx = 0;

    for (const tokenRelPath of tokenFiles) {
        const tokenFileAbs = path.join(providersRootAbs, tokenRelPath);
        const relImport = path
            .relative(outDir, tokenFileAbs)
            .replace(/\\/g, "/")
            .replace(/\.ts$/, "");
        const alias = `__token${idx++}`;
        imports.push(`import { token as ${alias} } from "${relImport}";`);

        const parts = tokenRelPath.split(path.sep);
        if (parts.length < 2) continue;

        // берем все папки от Providers до папки провайдера
        let categories = parts.slice(0, -2).map((p) => pascal(p));

        // игнорируем папку "Singletons" в категориях
        categories = categories.filter((c) => c.toLowerCase() !== "singletons");

        const leaf = pascal(path.basename(parts[parts.length - 1]).replace(/Token\.ts$/, ""));

        setTree(tree, ["Singletons", ...categories, leaf], alias);
    }

    const content = `/* AUTO-GENERATED. DO NOT EDIT. */
${imports.join("\n")}

export const ${t.typeName} = ${emitObject(tree)} as const;

export type ${t.typeName}Shape = typeof ${t.typeName};
`;

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outAbs, content);
}
