import { around } from "monkey-around";
import {
    MarkdownPostProcessor,
    MarkdownRenderer,
    MarkdownPreviewView,
    TFile,
    MarkdownRenderChild,
    MarkdownPostProcessorContext,
} from "obsidian";
import { DataviewApi } from "obsidian-dataview";
import TypingPlugin from "./main";
import { ScriptContext } from "./eval";
import { Type } from "./type";
import { getFirstSignificantLineNumber } from "./utils";

const HEADER_CODEBLOCK_LANGUAGE = "typing-header";
const FOOTER_CODEBLOCK_LANGUAGE = "typing-footer";
const HEADER_CODEBLOCK = `\`\`\`${HEADER_CODEBLOCK_LANGUAGE}\n\`\`\`\n`;
const FOOTER_CODEBLOCK = `\n\`\`\`${FOOTER_CODEBLOCK_LANGUAGE}\n\`\`\``;

class MarginalSection extends MarkdownRenderChild {
    constructor(
        containerEl: HTMLElement,
        public scriptSource: string,
        public plugin: TypingPlugin,
        public api: DataviewApi,
        public ctx: MarkdownPostProcessorContext,
        public kind: "js" | "md",
        public noteType: Type
    ) {
        super(containerEl);
    }
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
    onMetadataChange = (op: "update", file: TFile) => {
        this.update();
    };
    update = () => {
        this.hide();
        this.show();
    };
    show = async () => {
        if (this.kind == "js") {
            let scriptContext = new ScriptContext(
                this.api,
                this.ctx.sourcePath,
                this.containerEl,
                this.noteType
            );
            await scriptContext.asyncEvalScript(this.scriptSource);
        } else {
            MarkdownRenderer.renderMarkdown(
                this.scriptSource,
                this.containerEl,
                this.ctx.sourcePath,
                null
            );
        }
    };
    hide = () => {
        while (this.containerEl.firstChild) {
            this.containerEl.removeChild(this.containerEl.firstChild);
        }
    };
}

function marginalsPostProcessor(plugin: TypingPlugin): MarkdownPostProcessor {
    return async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        let info = ctx.getSectionInfo(el);
        if (!info) {
            return;
        }

        let type = await plugin.getType(ctx.sourcePath);

        if (!type) {
            return;
        }

        if (!type.header && !type.footer) {
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

        if (isLastLine && type.footer) {
            let containerEl = el.createDiv({ cls: "typing-footer" });
            ctx.addChild(
                new MarginalSection(
                    containerEl,
                    type.footer.value,
                    plugin,
                    await plugin.dataviewApi(),
                    ctx,
                    type.footer.kind,
                    type
                )
            );
        }

        if (isFirstLine && type.header) {
            let containerEl = el.createDiv({ cls: "typing-header" });
            el.insertBefore(containerEl, el.firstChild);
            ctx.addChild(
                new MarginalSection(
                    containerEl,
                    type.header.value,
                    plugin,
                    await plugin.dataviewApi(),
                    ctx,
                    type.header.kind,
                    type
                )
            );
        }
    };
}

export function monkeyPatchPreviewView(plugin: TypingPlugin) {
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

export function registerMarginalsPostProcessors(plugin: TypingPlugin) {
    plugin.registerMarkdownCodeBlockProcessor(
        HEADER_CODEBLOCK_LANGUAGE,
        async (
            source: string,
            el: HTMLElement,
            ctx: MarkdownPostProcessorContext
        ) => {
            let type = await plugin.getType(ctx.sourcePath);
            if (!type) {
                return;
            }
            if (!type.header) {
                return;
            }
            let containerEl = el.createDiv({ cls: "typing-header" });
            ctx.addChild(
                new MarginalSection(
                    containerEl,
                    type.header.value,
                    plugin,
                    await plugin.dataviewApi(),
                    ctx,
                    type.header.kind,
                    type
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
            let type = await plugin.getType(ctx.sourcePath);
            if (!type) {
                return;
            }
            if (!type.footer) {
                return;
            }
            let containerEl = el.createDiv({ cls: "typing-footer" });
            ctx.addChild(
                new MarginalSection(
                    containerEl,
                    type.footer.value,
                    plugin,
                    await plugin.dataviewApi(),
                    ctx,
                    type.footer.kind,
                    type
                )
            );
        }
    );

    let postProcess = marginalsPostProcessor(plugin);
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
