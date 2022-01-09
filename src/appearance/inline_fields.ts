import { MarkdownPostProcessorContext } from "obsidian";
import TypingPlugin from "src/main";

export function hideInlineFields(
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
) {
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
}

export function registerInlineFieldsPostProcessor(plugin: TypingPlugin) {
    plugin.registerMarkdownPostProcessor(hideInlineFields);
}
