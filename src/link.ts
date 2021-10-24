import {
    MarkdownPostProcessor,
    MarkdownPostProcessorContext,
    MarkdownRenderChild,
    TFile,
} from "obsidian";
import TypingPlugin from "./main";
import { EvalContext } from "./eval";
import { TypedNote } from "./typed_note";

class LinkChild extends MarkdownRenderChild {
    note: TypedNote;
    constructor(
        containerEl: HTMLElement,
        public plugin: TypingPlugin,
        public path: string,
        public text: string
    ) {
        super(containerEl);

        // BUG: onload() is only called on links in body, doesn't work inside dv.renderValue,
        // hence callung update() on initialization
        this.update();
    }
    show = async () => {
        if (this.note.icon) {
            let iconEl = document.createElement("span");
            iconEl.className = "typing-icon " + this.note.icon;
            this.containerEl.prepend(iconEl);
            this.containerEl.appendText(this.text);
            return;
        }

        if (this.note.render?.link) {
            let namespace = this.plugin.getDefaultContext(this.note);
            let scriptContext = new EvalContext({
                containerEl: this.containerEl,
                ...namespace,
            });
            scriptContext.asyncEval(this.note.render.link.source);
            return;
        }

        this.containerEl.appendText(this.text);
    };
    onload() {
        this.registerEvent(
            this.plugin.app.metadataCache.on(
                "dataview:metadata-change",
                this.onMetadataChange
            )
        );
        this.update();
    }
    onunload() {}
    onMetadataChange = async (op: "update", file: TFile) => {
        if (file.path === this.path) {
            await this.update();
        }
    };
    update = async () => {
        this.note = this.plugin.asTyped(this.path);
        if (!this.note) {
            return;
        }
        this.hide();
        await this.show();
    };
    hide = () => {
        while (this.containerEl.firstChild) {
            this.containerEl.removeChild(this.containerEl.firstChild);
        }
    };
}

function linksPostProcessor(plugin: TypingPlugin): MarkdownPostProcessor {
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

                ctx.addChild(
                    new LinkChild(link, plugin, resolvedPath, link.innerText)
                );
            }
        );
    };
}

export function registerLinksPostProcessor(plugin: TypingPlugin) {
    let postProcess = linksPostProcessor(plugin);
    plugin.registerMarkdownPostProcessor(postProcess);
}
