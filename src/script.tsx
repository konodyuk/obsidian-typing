import { availablePlugins, transform } from "@babel/standalone";
import {
    Component,
    MarkdownPostProcessorContext,
    MarkdownRenderer,
} from "obsidian";
import { Fragment, h, render } from "preact";
import { useState } from "preact/hooks";
import styled from "styled-components";
import { ctx } from "./context";
import TypingPlugin from "./main";
import { Note } from "./typing/note";
import { Type } from "./typing/type";
import { TextValue } from "./typing/value";

// alternative implementation: produces a 1.2MB bundle (vs 2.3MB), but doesn't work on mobile yet:
// import { transform } from "@babel/core";
// import transformReactJSX from "@babel/plugin-transform-react-jsx";

const transformReactJSX = availablePlugins["transform-react-jsx"];

type ContextType = Record<string, any>;

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export class Script {
    constructor(public source: TextValue, public preamble: TextValue = null) {}
    async run({
        note,
        type,
        container,
        context = {},
        async = true,
    }: {
        note?: Note;
        type?: Type;
        container?: HTMLElement;
        context?: ContextType;
        async?: boolean;
    }): Promise<any> {
        let baseContext = this.context({
            note: note,
            type: type,
            container: container,
        });
        let resultContext: ContextType = {
            ...baseContext,
            ...context,
        };

        let currentPreamble = (await this.preamble?.value()) || "";
        let contextPreamble = contextToPreamble(resultContext);
        let settingsPreamble =
            (await (note?.type || type)?.settings?.preamble?.value()) || "";
        let source = await this.source.value();

        source = `${currentPreamble}; ${settingsPreamble}; ${contextPreamble}; ${source}`;

        source = this.transformSource(source);

        if (async) {
            return await this._execAsync(source, resultContext);
        } else {
            return this._exec(source, resultContext);
        }
    }
    private _exec(source: string, context: ContextType): any {
        // URL: https://esbuild.github.io/content-types/#direct-eval
        return new Function(source).call(context);
    }
    private async _execAsync(
        source: string,
        context: ContextType
    ): Promise<any> {
        // URL: https://davidwalsh.name/async-function-class
        return await new AsyncFunction(
            "return (async () => {" + source + "})()"
        ).call(context);
    }
    baseContext(): ContextType {
        return {
            app: ctx.app,
            plugin: ctx.plugin,
            dv: ctx.dv,
            registry: ctx.registry,
            Note: (path: string) => new Note(path),
            Type: (name: string) => ctx.registry.byName(name),
        };
    }
    context({
        note,
        type,
        container,
    }: {
        note?: Note;
        type?: Type;
        container?: HTMLElement;
    }): ContextType {
        type = note?.type || type;

        let baseContext: ContextType = {
            ...this.baseContext(),
            note: note,
            type: type,
        };

        if (container) {
            baseContext["container"] = container;
            baseContext = {
                ...baseContext,
                ...createMarkdownRenderingContext(container, note.path),
            };
        }
        return baseContext;
    }
    transformSource(source: string): string {
        return source;
    }
}

export class JSXScript extends Script {
    transformSource(source: string): string {
        let options = {
            plugins: [
                [transformReactJSX, { pragma: "h", pragmaFrag: "Fragment" }],
            ],
        };
        let result = transform(source, options);
        return result.code;
    }
    baseContext(): ContextType {
        return {
            ...super.baseContext(),
            h: h,
            Fragment: Fragment,
            useState: useState,
            render: render,
            styled: styled,
        };
    }
}

function createMarkdownRenderingContext(
    containerDefault: HTMLElement,
    notePathDefault: string
) {
    async function renderMarkdown(
        source: string,
        container?: HTMLElement,
        notePath?: string,
        component: Component = null
    ) {
        if (!container) {
            container = containerDefault;
        }
        if (!notePath) {
            notePath = notePathDefault;
        }

        let subcontainer = container.createSpan();
        await MarkdownRenderer.renderMarkdown(
            source,
            subcontainer,
            notePath,
            component
        );

        let par = subcontainer.querySelector("p");
        if (subcontainer.children.length == 1 && par) {
            while (par.firstChild) {
                subcontainer.appendChild(par.firstChild);
            }
            subcontainer.removeChild(par);
        }
    }

    const Markdown = ({ text, children }: { text: string; children: any }) => {
        if (children) {
            text = children;
        }
        return (
            <span
                ref={(el) => {
                    renderMarkdown(text, el);
                }}
            ></span>
        );
    };

    return {
        renderMarkdown: renderMarkdown,
        markdown: renderMarkdown,
        md: renderMarkdown,
        Markdown: Markdown,
        Md: Markdown,
    };
}

function contextToPreamble(context: ContextType): string {
    let result = "";
    for (let key in context) {
        result += `let ${key} = this["${key}"];`;
    }
    return result;
}

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

let codeBlockRenderingManager = new CodeBlockRenderingManager();

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
                ctx: MarkdownPostProcessorContext
            ) => {
                codeBlockRenderingManager.maybeRerender(
                    null,
                    async (container, source) => {
                        let script = new scriptType(
                            new TextValue({ value: source })
                        );
                        let note = new Note(ctx.sourcePath);

                        await script
                            .run({ note: note, container: container })
                            .catch((reason) =>
                                render(
                                    <pre>{`Error:\n${reason}`}</pre>,
                                    container
                                )
                            );
                    },
                    ctx,
                    container,
                    source
                );
            }
        );
    }
}
