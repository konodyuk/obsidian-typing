import { importModules } from "src/api_imports";
import { gctx } from "src/context";
import { Visitors } from "src/language";
import { Note, Type } from "src/typing";
import * as ui from "src/ui";
import { TypeSuggestModal } from "src/ui";

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
    get platform() {
        return gctx.platform;
    }

    get otl() {
        return { run: (code: string) => gctx.interpreter.runCode(code, Visitors.Expression), Visitors };
    }

    ui = ui;
    prompt = ui.prompt;

    promptType = (types?: string[]) => {
        return new Promise<Type>((resolve, reject) => {
            let modal = new TypeSuggestModal(gctx.app, (type) => resolve(type), types);
            modal.open();
        });
    };

    note(path: string): Note {
        return new Note(path);
    }
    type(opt: string | { path?: string; folder?: string; name?: string }): Type {
        if (typeof opt == "string") {
            return gctx.graph.get({ name: opt });
        }
        let { name, folder, path } = opt;
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

    _import_explicit(path: string, symbols: any[], base?: string): Record<string, any> {
        if (path in this.lib) {
            return this.lib[path as keyof typeof this.lib];
        }
        let mod = gctx.importManager.importSmart(path, base);
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
