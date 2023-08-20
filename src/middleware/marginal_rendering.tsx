import styled from "@emotion/styled";
import { around } from "monkey-around";
import {
    EventRef,
    MarkdownPostProcessor,
    MarkdownPostProcessorContext,
    MarkdownPreviewView,
    MarkdownRenderChild,
    MarkdownRenderer,
} from "obsidian";
import { useState } from "react";
import { gctx } from "src/context";
import TypingPlugin from "src/main";
import { Script } from "src/scripting";
import { Note, Values } from "src/typing";
import { eagerDebounce, render, throttle } from "src/utilities";

const HEADER_CODEBLOCK_LANGUAGE = "typing-header";
const FOOTER_CODEBLOCK_LANGUAGE = "typing-footer";
const HEADER_CODEBLOCK = `\`\`\`${HEADER_CODEBLOCK_LANGUAGE}\n\`\`\`\n`;
const FOOTER_CODEBLOCK = `\n\`\`\`${FOOTER_CODEBLOCK_LANGUAGE}\n\`\`\``;
const TIMEOUT = 1000;

const ErrorContainer = styled.div`
    border-radius: var(--radius-m);
    border: 1px solid var(--background-modifier-border);
    background-color: var(--background-secondary);
    overflow: hidden;
`;

const ErrorLine = styled.div`
    background-color: var(--color-red);
    padding: var(--size-4-1);
    /* color: white; */
    /* border-radius: var(--radius-m); */
    /* border: 1px solid var(--background-modifier-border); */
`;

const ErrorDisclosure = ({
    message,
    traceback,
    type,
}: {
    message: string;
    traceback: string;
    type: "header" | "footer";
}) => {
    let [open, setOpen] = useState(false);
    return (
        <ErrorContainer>
            <ErrorLine onClick={() => setOpen(!open)}>
                Error in {type}: {message?.slice(0, 20)}...
            </ErrorLine>
            {open && (
                <pre>
                    Message: {message}
                    <br />
                    Traceback: {gctx.isMobile ? "Please see the desktop app" : traceback}
                </pre>
            )}
        </ErrorContainer>
    );
};

class MarginalRenderChild extends MarkdownRenderChild {
    private debouncedUpdate: ReturnType<typeof throttle>;
    public note: Note;
    public messages: string[];
    public isAutoreloadEnabled: boolean = true;
    public deferredCallbacks: (() => void)[] = [];
    public deferredEvents: EventRef[] = [];

    constructor(containerEl: HTMLElement, public path: string, public marginalType: "header" | "footer") {
        super(containerEl);
        this.note = new Note(path);
        this.debouncedUpdate = eagerDebounce(this.update, TIMEOUT);
    }
    get marginal() {
        return this.note?.type?.style[this.marginalType];
    }
    onload() {
        this.registerEvent(
            gctx.plugin.app.metadataCache.on("dataview:metadata-change", (op, file) => {
                if (!this.isAutoreloadEnabled) return;
                if (file.path != this.path) return;
                this.onMetadataChange();
            })
        );
        this.registerEvent(
            gctx.plugin.app.metadataCache.on("typing:schema-change", () => {
                this.onSchemaChange();
            })
        );
        this.requestUpdate();
    }
    onunload() {
        this.hide();
    }
    onMetadataChange = () => {
        this.requestUpdate();
    };
    onSchemaChange = () => {
        this.note = new Note(this.path);
        this.requestUpdate();
    };
    requestUpdate = () => {
        this.debouncedUpdate();
    };
    update = () => {
        this.hide();
        this.show();
    };
    print = (...args) => {
        this.messages.push(`${args}`);
    };
    show = async () => {
        this.isAutoreloadEnabled = true;
        if (!this.marginal) return;
        if (this.marginal instanceof Script) {
            const context = {
                container: this.containerEl,
                component: this,
                note: this.note,
                render: (el) => render(el, this.containerEl),
                print: this.print,
                reload: () => this.requestUpdate(),
                on: (event, handler) => {
                    this.deferredEvents.push(gctx.plugin.app.metadataCache.on(event, handler));
                },
                register: (cb: () => void) => {
                    this.deferredCallbacks.push(cb);
                },
                registerEvent: (ref: EventRef) => {
                    this.deferredEvents.push(ref);
                },
                disableAutoreload: () => {
                    this.isAutoreloadEnabled = false;
                },
            };
            this.messages = [];
            try {
                let el;
                if (this.marginal instanceof Script) el = this.marginal.call(context);
                let contentEl = this.containerEl.createDiv();
                if (el != null) {
                    render(<>{el}</>, contentEl);
                }
            } catch (e) {
                let errorContainer = this.containerEl.createDiv();
                render(
                    <ErrorDisclosure message={e.message} traceback={e.stack} type={this.marginalType} />,
                    errorContainer
                );
            }
            if (this.messages.length) {
                let printContainer = this.containerEl.createDiv();
                render(<pre>{this.messages.join("\n")}</pre>, printContainer);
            }
        }
        if (this.marginal instanceof Values.Markdown) {
            MarkdownRenderer.renderMarkdown(this.marginal.source, this.containerEl, this.path, this);
        }
    };
    hide = () => {
        while (this.containerEl.firstChild) {
            this.containerEl.removeChild(this.containerEl.firstChild);
        }
        for (let callback of this.deferredCallbacks) {
            try {
                callback();
            } catch {}
        }
        for (let eventRef of this.deferredEvents) {
            gctx.app.metadataCache.offref(eventRef);
            gctx.app.workspace.offref(eventRef);
            gctx.app.vault.offref(eventRef);
        }
        this.deferredCallbacks = [];
        this.deferredEvents = [];
    };
}

export function registerMarginalMonkeyPatch(plugin: TypingPlugin) {
    plugin.register(
        around(MarkdownPreviewView.prototype, {
            get(oldMethod) {
                return function (...args) {
                    let result = oldMethod && oldMethod.apply(this, args);
                    if (gctx.settings.marginalsInPreview) {
                        result = result.replaceAll(HEADER_CODEBLOCK, "");
                        result = result.replaceAll(FOOTER_CODEBLOCK, "");
                    }
                    return result;
                };
            },
            set(oldMethod) {
                return function (...args) {
                    if (gctx.settings.marginalsInPreview) {
                        args[0] = injectHeader(args[0], HEADER_CODEBLOCK);
                        args[0] = args[0] + FOOTER_CODEBLOCK;
                    }
                    const result = oldMethod && oldMethod.apply(this, args);
                    return result;
                };
            },
        })
    );
}

// NOTE: works in previews and embeds
function marginalPostProcessor(plugin: TypingPlugin): MarkdownPostProcessor {
    return async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        if (!gctx.settings.marginalsInPreview) return;

        let info = ctx.getSectionInfo(el);
        if (!info) {
            return;
        }

        let container: HTMLElement = ctx.containerEl;
        for (let depth = 0; depth < 4; depth++) {
            if (!container) break;
            if (container.classList.contains("inline-embed") && container.getAttr("src")?.contains("#")) return;
            container = container.parentElement;
        }

        if (info.text.contains(HEADER_CODEBLOCK) || info.text.contains(FOOTER_CODEBLOCK)) {
            return;
        }

        let lastLine = (info.text.trimRight().match(/\n/g) || "").length;
        let isLastLine = lastLine === info.lineEnd;

        let isFirstLine = getFirstSignificantLineNumber(info.text) == info.lineStart;

        if (!isLastLine && !isFirstLine) {
            return;
        }

        if (isLastLine) {
            let containerEl = el.createDiv({ cls: "typing-footer" });
            ctx.addChild(new MarginalRenderChild(containerEl, ctx.sourcePath, "footer"));
        }

        // if (isFirstLine && type.style.header) {
        if (isFirstLine) {
            let containerEl = el.createDiv({ cls: "typing-header" });
            el.insertBefore(containerEl, el.firstChild);
            ctx.addChild(new MarginalRenderChild(containerEl, ctx.sourcePath, "header"));
        }
    };
}

// NOTE: works in editor and markdown view, doesnt work in preview
export function registerMarginalPostProcessor(plugin: TypingPlugin) {
    plugin.registerMarkdownCodeBlockProcessor(
        HEADER_CODEBLOCK_LANGUAGE,
        async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            let containerEl = el.createDiv({ cls: "typing-header" });
            ctx.addChild(new MarginalRenderChild(containerEl, ctx.sourcePath, "header"));
        }
    );
    plugin.registerMarkdownCodeBlockProcessor(
        FOOTER_CODEBLOCK_LANGUAGE,
        async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            let containerEl = el.createDiv({ cls: "typing-footer" });
            ctx.addChild(new MarginalRenderChild(containerEl, ctx.sourcePath, "footer"));
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
