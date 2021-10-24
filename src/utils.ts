import { Notice } from "obsidian";

export function getFrontmatterLengthInLines(body: string) {
    let yamlSymbol = "---";
    if (!body.startsWith(yamlSymbol)) {
        return 0;
    }
    let yamlEndSymbolIndex = body.indexOf(yamlSymbol, 3);
    let yamlEndIndex = body.indexOf("\n", yamlEndSymbolIndex);
    let frontmatter = body.substring(0, yamlEndIndex);
    return frontmatter.split("\n").length;
}

export function getFirstSignificantLineNumber(body: string) {
    let fmLength = getFrontmatterLengthInLines(body);
    let lines = body.split("\n");
    for (let i = fmLength; i < lines.length; i++) {
        if (lines[i].trim()) {
            return i;
        }
    }
    return lines.length;
}

export function gracefullyAlert(message: string) {
    new Notice("Typing: " + message);
    console.log("Typing: " + message);
}
