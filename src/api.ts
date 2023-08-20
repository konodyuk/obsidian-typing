import { importModules } from "src/api_imports";
import { gctx } from "src/context";
import { Note, Type } from "src/typing";
import * as ui from "src/ui";

type PromiseType<T> = T extends Promise<infer U> ? U : never;

export class TypingAPI {
    get app() {
        return gctx.app;
    }
    get plugin() {
        return gctx.plugin;
    }
    get dv() {
        return gctx.dv;
    }
    get graph() {
        return gctx.graph;
    }
    get relations() {
        return gctx.relations;
    }

    ui = ui;
    prompt = ui.prompt;

    note(path: string): Note {
        return new Note(path);
    }
    type({ name, folder, path }: { path?: string; folder?: string; name?: string }): Type {
        return gctx.graph.get({ name, folder, path });
    }

    lib: PromiseType<ReturnType<typeof importModules>>;

    import(path: string): Record<string, any> {
        let mod = gctx.importManager.importSmart(path);
        if (mod == null) {
            throw new Error(`ImportError: Could not find module ${path}`);
        }
        if (mod.error != null) {
            throw new Error(`ImportError: Error in module ${path}: ${mod.error}`);
        }
        return mod.env;
    }

    _import_explicit(path: string, symbols: any[]): Record<string, any> {
        if (path in this.lib) {
            return this.lib[path as keyof typeof this.lib];
        }
        let mod = gctx.importManager.importSmart(path);
        if (mod == null) {
            throw new Error(`ImportError: Could not find module ${path}`);
        }
        if (mod.error != null) {
            throw new Error(`ImportError: Error in module ${path}: ${mod.error}`);
        }
        for (let arg of symbols) {
            if (!(arg in mod.env)) {
                throw new Error(`ImportError: Could not find symbol ${arg} in module ${path}`);
            }
        }
        return mod.env;
    }
}
