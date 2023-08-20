import { gctx } from "src/context";
import { setPanelContent } from "src/editor/editor";
import { parser } from "src/language/grammar/otl_parser";
import { Visitors } from "src/language/visitors";
import { FileSpec, Module, ModuleManagerSync } from "src/utilities/module_manager_sync";

export class Interpreter extends ModuleManagerSync {
    extensions = ["otl"];

    public evaluateModule(file: FileSpec, mod: Module): boolean {
        setPanelContent(`Importing ${this.activeModule?.file.path}...`);
        let tree = parser.parse(file.source);

        let lint = Visitors.File.lint(tree.topNode, { interpreter: this });
        if (lint.hasErrors) {
            mod.error = lint.diagnostics.map((d) => `${file.path}:${d.from}-${d.to}: ${d.message}`).join("\n");
        }
        let types = Visitors.File.run(tree.topNode, { interpreter: this });

        if (types == null) {
            setPanelContent(`Importing ${this.activeModule?.file.path} failed...`);
            return false;
        }
        mod.env = types;
        setPanelContent(`Importing ${this.activeModule?.file.path} succeeded...`);
        return true;
    }

    protected onAfterImport(fileName: string): void {
        if (fileName == gctx.plugin.settings.schemaPath) {
            gctx.graph.clear();
            let mainModule = this.modules[fileName];
            for (let key in mainModule.env) {
                gctx.graph.add(mainModule.env[key]);
            }
            gctx.app.metadataCache.trigger("typing:schema-change");
        }
    }

    protected onAfterPreload(): void {
        this.importModule(gctx.plugin.settings.schemaPath, null, true);
    }
}
