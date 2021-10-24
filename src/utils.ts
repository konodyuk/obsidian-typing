import { Notice, MarkdownPostProcessorContext } from "obsidian";

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

export const hideInlineFields = (
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
) => {
    let parNodes = el.querySelectorAll("p");
    for (let i = 0; i < parNodes.length; i++) {
        let par = parNodes[i];
        let parChildren = par.childNodes;
        let childrenToRemove: Array<Node> = [];
        for (let j = 0; j < parChildren.length; j++) {
            let child = parChildren[j];
            if (
                child.nodeType == 3 &&
                child.textContent.match(
                    /^\s*[0-9\w\p{Letter}][-0-9\w\p{Letter}]*\s*::/u
                )
            ) {
                for (let k = j; k < parChildren.length; k++) {
                    childrenToRemove.push(parChildren[k]);
                    if (parChildren[k].nodeName == "BR") {
                        break;
                    }
                }
            }
        }
        for (let child of childrenToRemove) {
            par.removeChild(child);
        }
    }
};
