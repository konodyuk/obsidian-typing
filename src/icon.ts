import { MarkdownPostProcessor, MarkdownPostProcessorContext } from "obsidian";
import TypingPlugin from "./main";

function typeIconPostProcessor(plugin: TypingPlugin): MarkdownPostProcessor {
    return async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        el.querySelectorAll("a.internal-link").forEach(
            async (link: HTMLElement) => {
                if (!(link instanceof HTMLAnchorElement)) {
                    return;
                }

                let path = link.getAttr("href");
                let resolvedTFile =
                    plugin.app.metadataCache.getFirstLinkpathDest(
                        path,
                        ctx.sourcePath
                    );
                if (!resolvedTFile) {
                    return;
                }
                let resolvedPath = resolvedTFile.path;
                let type = await plugin.getType(resolvedPath);
                if (!type) {
                    return;
                }

                if (!type.icon) {
                    return;
                }
                if (type.icon.kind != "fa") {
                    return;
                }
                let firstChild = link.children[0];
                if (
                    firstChild &&
                    firstChild.tagName == "SPAN" &&
                    firstChild.classList.contains("typing-icon")
                ) {
                    return;
                }
                let iconEl = document.createElement("span");
                iconEl.className = "typing-icon " + type.icon.value;
                link.prepend(iconEl);
            }
        );
    };
}

export function registerTypeIconPostProcessor(plugin: TypingPlugin) {
    let postProcess = typeIconPostProcessor(plugin);
    plugin.registerMarkdownPostProcessor(postProcess);
}
