import { availablePlugins, transform } from "@babel/standalone";
import {
    Component,
    MarkdownPostProcessorContext,
    MarkdownRenderer,
} from "obsidian";
import { Fragment, h } from "preact";
import { useState } from "preact/hooks";
import { render } from "react-dom";
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
    }) {
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
            this._execAsync(source, resultContext);
        } else {
            this._exec(source, resultContext);
        }
    }
    private _exec(source: string, context: ContextType) {
        // URL: https://esbuild.github.io/content-types/#direct-eval
        return new Function(source).call(context);
    }
    private _execAsync(source: string, context: ContextType) {
        this._exec("(async () => {" + source + "})()", context);
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
            baseContext["md"] = baseContext["markdown"] = createRenderMarkdown(
                container,
                note.path
            );
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
        };
    }
}

function createRenderMarkdown(
    containerDefault: HTMLElement,
    notePathDefault: string
) {
    return async function renderMarkdown(
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
    };
}

function contextToPreamble(context: ContextType): string {
    let result = "";
    for (let key in context) {
        result += `let ${key} = this["${key}"];`;
    }
    return result;
}

export function registerOTLCodeBlockPostProcessors(plugin: TypingPlugin) {
    plugin.registerMarkdownCodeBlockProcessor(
        "typing-script",
        async (
            source: string,
            container: HTMLElement,
            ctx: MarkdownPostProcessorContext
        ) => {
            let script = new Script(new TextValue({ value: source }));
            let note = new Note(ctx.sourcePath);

            await script.run({ note: note, container: container });
        }
    );
    plugin.registerMarkdownCodeBlockProcessor(
        "typing-jsxscript",
        async (
            source: string,
            container: HTMLElement,
            ctx: MarkdownPostProcessorContext
        ) => {
            let script = new JSXScript(new TextValue({ value: source }));
            let note = new Note(ctx.sourcePath);

            await script.run({ note: note, container: container });
        }
    );
}
