import { Fragment, h } from "preact";
import { gctx } from "src/context";
import { FileSpec, Module, ModuleManagerSync } from "src/utilities/module_manager_sync";
import { compileModuleWithContext } from "./transpilation";

export class ImportManager extends ModuleManagerSync {
    extensions = ["tsx", "ts", "jsx", "js"];

    protected evaluateModule(file: FileSpec, mod: Module): boolean {
        try {
            mod.env = compileModuleWithContext(
                file.source,
                { api: gctx.api, h, Fragment },
                { transpile: true, filename: "@typing-script///" + file.path }
            );
            return true;
        } catch (e) {
            mod.error = e.message ?? e;
            return false;
        }
    }

    protected onAfterReload(): void {
        gctx.noteCache.invalidateAll();
        gctx.app.metadataCache.trigger("typing:schema-change");
    }
}
