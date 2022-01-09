import { around } from "monkey-around";
import {
    MarkdownPostProcessor,
    MarkdownPostProcessorContext,
    MarkdownPreviewView,
    MarkdownRenderChild,
    TFile,
} from "obsidian";
import { ctx } from "src/context";
import { Note } from "src/typing/note";
import { Marginal } from "src/typing/value";
import TypingPlugin from "../main";

const HEADER_CODEBLOCK_LANGUAGE = "typing-header";
const FOOTER_CODEBLOCK_LANGUAGE = "typing-footer";
const HEADER_CODEBLOCK = `\`\`\`${HEADER_CODEBLOCK_LANGUAGE}\n\`\`\`\n`;
const FOOTER_CODEBLOCK = `\n\`\`\`${FOOTER_CODEBLOCK_LANGUAGE}\n\`\`\``;
const TIMEOUT = 1000;

class MarginalRenderChild extends MarkdownRenderChild {
    private shouldUpdate: boolean = false;
    private canUpdate: boolean = true;

    constructor(
        containerEl: HTMLElement,
        public note: Note,
        public marginal: Marginal
    ) {
        super(containerEl);
    }
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
        this.requestUpdate();
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
    update = () => {
        this.hide();
        this.show();
    };
    show = async () => {
        this.marginal.render(this.note, this.containerEl);
    };
    hide = () => {
        while (this.containerEl.firstChild) {
            this.containerEl.removeChild(this.containerEl.firstChild);
        }
    };
}

function marginalPostProcessor(plugin: TypingPlugin): MarkdownPostProcessor {
    return async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        let info = ctx.getSectionInfo(el);
        if (!info) {
            return;
        }

        let note = new Note(ctx.sourcePath);
        if (!note?.type) {
            return;
        }

        let type = note.type;
        if (!type?.appearance?.header && !type?.appearance?.footer) {
            return;
        }

        if (
            info.text.contains(HEADER_CODEBLOCK) ||
            info.text.contains(FOOTER_CODEBLOCK)
        ) {
            return;
        }

        let lastLine = (info.text.trimRight().match(/\n/g) || "").length;
        let isLastLine = lastLine === info.lineEnd;

        let isFirstLine =
            getFirstSignificantLineNumber(info.text) == info.lineStart;

        if (!isLastLine && !isFirstLine) {
            return;
        }

        if (isLastLine && type.appearance.footer) {
            let containerEl = el.createDiv({ cls: "typing-footer" });
            ctx.addChild(
                new MarginalRenderChild(
                    containerEl,
                    note,
                    note.type.appearance.footer
                )
            );
        }

        if (isFirstLine && type.appearance.header) {
            let containerEl = el.createDiv({ cls: "typing-header" });
            el.insertBefore(containerEl, el.firstChild);
            ctx.addChild(
                new MarginalRenderChild(
                    containerEl,
                    note,
                    note.type.appearance.header
                )
            );
        }
    };
}

export function registerMarginalMonkeyPatch(plugin: TypingPlugin) {
    plugin.register(
        around(MarkdownPreviewView.prototype, {
            get(oldMethod) {
                return function (...args) {
                    let result = oldMethod && oldMethod.apply(this, args);
                    result = result.replaceAll(HEADER_CODEBLOCK, "");
                    result = result.replaceAll(FOOTER_CODEBLOCK, "");
                    return result;
                };
            },
            set(oldMethod) {
                return function (...args) {
                    args[0] = injectHeader(args[0], HEADER_CODEBLOCK);
                    args[0] = args[0] + FOOTER_CODEBLOCK;
                    const result = oldMethod && oldMethod.apply(this, args);
                    return result;
                };
            },
        })
    );
}

export function registerMarginalPostProcessor(plugin: TypingPlugin) {
    plugin.registerMarkdownCodeBlockProcessor(
        HEADER_CODEBLOCK_LANGUAGE,
        async (
            source: string,
            el: HTMLElement,
            ctx: MarkdownPostProcessorContext
        ) => {
            let note = new Note(ctx.sourcePath);
            if (!note?.type?.appearance?.header) {
                return;
            }
            let containerEl = el.createDiv({ cls: "typing-header" });
            ctx.addChild(
                new MarginalRenderChild(
                    containerEl,
                    note,
                    note.type.appearance.header
                )
            );
        }
    );
    plugin.registerMarkdownCodeBlockProcessor(
        FOOTER_CODEBLOCK_LANGUAGE,
        async (
            source: string,
            el: HTMLElement,
            ctx: MarkdownPostProcessorContext
        ) => {
            let note = new Note(ctx.sourcePath);
            if (!note?.type?.appearance?.footer) {
                return;
            }
            let containerEl = el.createDiv({ cls: "typing-footer" });
            ctx.addChild(
                new MarginalRenderChild(
                    containerEl,
                    note,
                    note.type.appearance.footer
                )
            );
        }
    );

    let postProcess = marginalPostProcessor(plugin);
    postProcess.sortOrder = -1000;
    plugin.registerMarkdownPostProcessor(postProcess);
}

export function injectHeader(body: string, header: string) {
    let yamlSymbol = "---";
    if (!body.startsWith(yamlSymbol)) {
        return HEADER_CODEBLOCK + body;
    }
    let yamlEndSymbolIndex = body.indexOf(yamlSymbol, 3);
    let yamlEndIndex = body.indexOf("\n", yamlEndSymbolIndex);
    let frontmatter = body.substring(0, yamlEndIndex + 1);
    let note = body.substring(yamlEndIndex + 1);
    return frontmatter + HEADER_CODEBLOCK + note;
}

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
