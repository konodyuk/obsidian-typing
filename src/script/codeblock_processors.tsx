import { MarkdownPostProcessorContext } from "obsidian";
import { h, render } from "preact";
import { ctx } from "../context";
import TypingPlugin from "../main";
import { Note } from "../typing/note";
import { TextValue } from "../typing/value";
import { Script, JSXScript } from "./script";

const TIMEOUT = 500;

class CodeBlockRenderingManager {
    currentPath: string = null;
    containerIndex: {
        [containerLineStart: number]: {
            shouldRerender: boolean;
            canRerender: boolean;
            container: HTMLElement;
            ctx: MarkdownPostProcessorContext;
            source: string;
            fn: { (container: HTMLElement, source: string): void };
        };
    } = {};
    maybeRerender(
        lineStart?: number,
        fn?: { (container: HTMLElement, source: string): void },
        ctx?: MarkdownPostProcessorContext,
        container?: HTMLElement,
        source?: string
    ) {
        if (ctx && ctx.sourcePath != this.currentPath) {
            this.containerIndex = {};
            this.currentPath = ctx.sourcePath;
        }

        let containerLineStart: number;
        if (lineStart != null) {
            containerLineStart = lineStart;
        } else {
            containerLineStart = ctx.getSectionInfo(container).lineStart || -1;
            if (!(containerLineStart in this.containerIndex)) {
                this.containerIndex[containerLineStart] = {
                    shouldRerender: false,
                    canRerender: true,
                    container: container,
                    ctx: ctx,
                    source: source,
                    fn: fn,
                };
            }
            this.containerIndex[containerLineStart].container = container;
            this.containerIndex[containerLineStart].ctx = ctx;
            this.containerIndex[containerLineStart].source = source;
            this.containerIndex[containerLineStart].fn = fn;
        }
        let containerEntry = this.containerIndex[containerLineStart];

        if (containerEntry.canRerender) {
            containerEntry.shouldRerender = false;
            containerEntry.fn(containerEntry.container, containerEntry.source);
            containerEntry.canRerender = false;

            setTimeout(() => {
                this.containerIndex[containerLineStart].canRerender = true;
                if (this.containerIndex[containerLineStart].shouldRerender) {
                    this.maybeRerender(containerLineStart);
                }
            }, TIMEOUT);
        } else {
            containerEntry.shouldRerender = true;

            render(<pre>Rendering...</pre>, container);
        }
    }
}

export let codeBlockRenderingManager = new CodeBlockRenderingManager();

export function registerOTLCodeBlockPostProcessors(plugin: TypingPlugin) {
    for (let { languageCode, scriptType } of [
        { languageCode: "typing-script", scriptType: Script },
        { languageCode: "typing-jsxscript", scriptType: JSXScript },
    ]) {
        plugin.registerMarkdownCodeBlockProcessor(
            languageCode,
            async (
                source: string,
                container: HTMLElement,
                mctx: MarkdownPostProcessorContext
            ) => {
                codeBlockRenderingManager.maybeRerender(
                    null,
                    async (container, source) => {
                        let preamble = null;
                        if (
                            !new Note(mctx.sourcePath).type?.settings?.preamble
                        ) {
                            preamble = ctx.registry?.settings?.preamble;
                        }
                        let script = new scriptType(
                            new TextValue({ value: source }),
                            preamble
                        );
                        let note = new Note(mctx.sourcePath);

                        await script
                            .run({ note: note, container: container })
                            .catch((reason) =>
                                render(
                                    <pre>{`Error:\n${reason}`}</pre>,
                                    container
                                )
                            );
                    },
                    mctx,
                    container,
                    source
                );
            }
        );
    }
}
