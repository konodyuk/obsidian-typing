import { TAbstractFile, TFile } from "obsidian";
import TypingPlugin from "src/main";
import { ctx } from "../context";
import { AsyncFunction } from "./script";
import {
    contextToPreamble,
    ContextType,
    createBaseContext,
} from "./script_context";
import { transpileJSX } from "./transpilation";

type Namespace = any;

export class IncludeManager {
    modules: Record<string, Namespace> = {};

    async compile(source: string): Promise<Namespace> {
        let context: ContextType = createBaseContext();
        context.module = { exports: null };
        await new AsyncFunction(
            "return (async () => {" +
                contextToPreamble(context) +
                source +
                "})()"
        ).call(context);
        return context.module.exports;
    }
    async load(path: string, transpile: boolean = true): Promise<Namespace> {
        let file = ctx.app.vault.getAbstractFileByPath(path);
        let source = await ctx.app.vault.read(file as TFile);
        if (transpile) {
            source = transpileJSX(source);
        }
        return await this.compile(source);
    }
    async reload(path: string, transpile: boolean = true) {
        this.modules[path] = await this.load(path, transpile);
    }
    async include(path: string, transpile: boolean = true): Promise<Namespace> {
        if (!(path in this.modules)) {
            await this.reload(path, transpile);
        }
        return this.modules[path];
    }
}

export function registerIncludeManager(plugin: TypingPlugin) {
    ctx.include_manager = new IncludeManager();
    plugin.registerEvent(
        ctx.app.vault.on("modify", (file: TAbstractFile) => {
            if (file.path in ctx.include_manager.modules) {
                ctx.include_manager.reload(file.path);
            }
        })
    );
}

// ALTERNATIVE IMPLEMENTATION:
//
// https://stackoverflow.com/a/17585470
// https://github.com/floatdrop/require-from-string/blob/master/index.js
//
// var m = new Module("");
// m._compile(source, "");
// return m.exports;
