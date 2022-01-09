import {
    MarkdownPostProcessor,
    MarkdownPostProcessorContext,
    MarkdownRenderChild,
    TFile,
} from "obsidian";
import TypingPlugin from "src/main";
import { ctx } from "../context";
import { Note } from "../typing/note";

const TIMEOUT = 1000;

class LinkRenderChild extends MarkdownRenderChild {
    private shouldUpdate: boolean = false;
    private canUpdate: boolean = true;

    note: Note;
    constructor(
        containerEl: HTMLElement,
        public path: string,
        public text: string
    ) {
        super(containerEl);

        // BUG: onload() is only called on links in body, doesn't work inside dv.renderValue,
        // hence callung update() on initialization
        this.requestUpdate();
    }
    show = async () => {
        let iconValue = this.note.type?.appearance?.icon;
        if (iconValue) {
            let iconEl = document.createElement("span");
            iconEl.className =
                "typing-icon " + (await iconValue.value(this.note));
            this.containerEl.prepend(iconEl);
            this.containerEl.appendText(this.text);
            return;
        }

        let linkScript = this.note.type?.appearance?.link;
        if (linkScript) {
            linkScript.run({ note: this.note, container: this.containerEl });
            return;
        }

        this.containerEl.appendText(this.text);
    };
    onload() {
        this.registerEvent(
            ctx.plugin.app.metadataCache.on(
                "dataview:metadata-change",
                this.onMetadataChange
            )
        );
        this.requestUpdate();
    }
    onunload() {}
    onMetadataChange = (op: "update", file: TFile) => {
        if (file.path === this.path) {
            this.requestUpdate();
        }
    };
    requestUpdate = () => {
        if (this.canUpdate) {
            this.shouldUpdate = false;
            this.update();
            this.canUpdate = false;

            setTimeout(() => {
                this.canUpdate = true;
                if (this.shouldUpdate) {
                    this.requestUpdate();
                }
            }, TIMEOUT);
        } else {
            this.shouldUpdate = true;
        }
    };
    update = async () => {
        this.note = new Note(this.path);
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

function linkPostProcessor(plugin: TypingPlugin): MarkdownPostProcessor {
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
                    new LinkRenderChild(link, resolvedPath, link.innerText)
                );
            }
        );
    };
}

export function registerLinkPostProcessor(plugin: TypingPlugin) {
    let postProcess = linkPostProcessor(plugin);
    plugin.registerMarkdownPostProcessor(postProcess);
}
