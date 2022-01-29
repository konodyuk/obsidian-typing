import { addIcon, EventRef, Plugin, TFile } from "obsidian";
import {
    registerMarginalMonkeyPatch,
    registerMarginalPostProcessor,
} from "src/appearance/marginals";
import { registerInlineFieldsPostProcessor } from "./appearance/inline_fields";
import { registerLinkPostProcessor } from "./appearance/link";
import { registerLeafHook } from "./appearance/title_bar";
import { registerCommands } from "./commands";
import { ctx, GlobalContext } from "./context";
import {
    registerJSXEditorView,
    registerOTLEditorView,
    registerPrism,
} from "./language/editor";
import { compile } from "./language/grammar";
import { registerOTLCodeBlockPostProcessors } from "./script";
import { registerOnCreateTypedNoteCallback } from "./typing/callbacks";
import { Registry } from "./typing/registry";
import { warn } from "./utils";

export default class TypingPlugin extends Plugin {
    schemaPath: string = "typing.otl";
    reloadSchemaCallbackRef: EventRef;
    ctx: GlobalContext;

    async onload() {
        console.log("Typing: loading");
        ctx.setApp(this.app);
        ctx.setPlugin(this);
        ctx.setRegistry(new Registry());

        this.ctx = ctx;

        addIcon(
            "grid",
            `<path stroke="currentColor" fill="currentColor" d="m 34.375,0 h -25 c -5.1777344,0 -9.375,4.1972656 -9.375,9.375 v 25 c 0,5.175781 4.1972656,9.375 9.375,9.375 h 25 c 5.175781,0 9.375,-4.199219 9.375,-9.375 v -25 c 0,-5.1777344 -4.199219,-9.375 -9.375,-9.375 z m 56.25,56.25 h -25 c -5.175781,0 -9.375,4.199219 -9.375,9.375 v 25 c 0,5.177734 4.197266,9.375 9.375,9.375 h 25 c 5.177734,0 9.375,-4.197266 9.375,-9.375 v -25 c 0,-5.175781 -4.199219,-9.375 -9.375,-9.375 z m 0,-56.25 h -25 c -5.175781,0 -9.375,4.1972656 -9.375,9.375 v 25 c 0,5.175781 4.199219,9.375 9.375,9.375 h 25 c 5.175781,0 9.375,-4.199219 9.375,-9.375 v -25 c 0,-5.1777344 -4.199219,-9.375 -9.375,-9.375 z m -56.25,56.25 h -25 c -5.1777344,0 -9.375,4.199219 -9.375,9.375 v 25 c 0,5.175781 4.1972656,9.375 9.375,9.375 h 25 c 5.175781,0 9.375,-4.199219 9.375,-9.375 v -25 c 0,-5.175781 -4.199219,-9.375 -9.375,-9.375 z" />`
        );

        registerMarginalPostProcessor(this);
        registerMarginalMonkeyPatch(this);
        registerLinkPostProcessor(this);
        registerLeafHook(this);
        registerInlineFieldsPostProcessor(this);
        registerOTLEditorView(this);
        registerJSXEditorView(this);
        registerPrism(this);
        registerCommands(this);
        registerOTLCodeBlockPostProcessors(this);
        registerOnCreateTypedNoteCallback(this);

        this.app.workspace.onLayoutReady(() => this.reloadSchema());
        this.setSchemaReloader();
    }

    onunload() {
        console.log("Typing: unloading");
    }

    setSchemaReloader() {
        this.reloadSchemaCallbackRef = this.app.vault.on(
            "modify",
            this.reloadSchemaCallback
        );

        this.registerEvent(this.reloadSchemaCallbackRef);
    }

    resetSchemaReloader() {
        this.app.vault.off("modify", this.reloadSchemaCallback);
    }

    async reloadSchema() {
        let file = this.app.vault.getAbstractFileByPath(
            this.schemaPath
        ) as TFile;

        if (file == null) {
            warn(`schema file does not exist: ${this.schemaPath}`);
            return;
        }

        let code = await this.app.vault.read(file);
        let result = compile(code);

        if (result.status == false) {
            warn(
                `invalid schema file: ${this.schemaPath}. Open OTL Editor for details.`
            );
            return;
        }
        ctx.setRegistry(result.registry);
    }

    reloadSchemaCallback = (file: TFile) => {
        if (file.path === this.schemaPath) {
            this.reloadSchema();
        }
    };
}
