import { MarkdownPostProcessorContext } from "obsidian";
import TypingPlugin from "src/main";
import { Note } from "src/typing";
import { regexField } from "./field_accessor";

export function hideInlineFields(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    let note = new Note(ctx.sourcePath);
    let hideSetting = note.type?.style?.hide_inline_fields;
    if (!hideSetting || hideSetting == "none") return;

    let parNodes = el.querySelectorAll("p");
    for (let i = 0; i < parNodes.length; i++) {
        let par = parNodes[i];
        let parChildren = par.childNodes;
        let childrenToRemove: Array<Node> = [];
        for (let j = 0; j < parChildren.length; j++) {
            let child = parChildren[j];
            // NOTE: text node
            if (child.nodeType == 3) {
                let match = regexField.exec(child.textContent);
                if (
                    match &&
                    (hideSetting == "all" ||
                        (hideSetting == "defined" && note.type?.fields[match?.groups?.field] != null))
                )
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

export function registerInlineFieldsHider(plugin: TypingPlugin) {
    plugin.registerMarkdownPostProcessor(hideInlineFields);
}
