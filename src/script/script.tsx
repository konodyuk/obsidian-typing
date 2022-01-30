import { Note } from "../typing/note";
import { Type } from "../typing/type";
import { TextValue } from "../typing/value";
import { createMarkdownRenderingContext } from "./markdown_rendering";
import {
    contextToPreamble,
    ContextType,
    createBaseContext,
} from "./script_context";
import { transpileJSX } from "./transpilation";

export const AsyncFunction = Object.getPrototypeOf(
    async function () {}
).constructor;

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
        return createBaseContext();
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
        return transpileJSX(source);
    }
}
