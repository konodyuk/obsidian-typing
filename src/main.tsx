import { addIcon, Plugin } from "obsidian";
import { TypingAPI } from "src/api";
import { importModules } from "src/api_imports";
import { registerCommands } from "src/commands";
import { gctx, GlobalContext } from "src/context";
import { registerCodeEditorViews } from "src/editor";
import {
    registerFileCreationMenu,
    registerInlineFieldsHider,
    registerLinkPostProcessor,
    registerLinkRenderingLivePreview,
    registerMarginalMonkeyPatch,
    registerMarginalPostProcessor,
    registerTitleBarLeafHook,
} from "src/middleware";
import { DEFAULT_SETTINGS, registerSettings, TypingSettings } from "src/settings";
import { Field, FieldTypes, Prefix, Type } from "src/typing";
import { Picker, Pickers, prompt, Prompt } from "src/ui";
import { log } from "src/utilities";

export default class TypingPlugin extends Plugin {
    exports: any;
    ctx: GlobalContext;
    api: TypingAPI;

    settings: TypingSettings;

    async onload() {
        log.info("Loading plugin");

        await this.loadSettings();

        gctx.populateContext(this);

        this.ctx = gctx;
        this.api = new TypingAPI();
        this.api.lib = await importModules();

        await this.ctx.interpreter.setup();
        await this.ctx.importManager.setup();

        if (gctx.testing) return;

        addIcon(
            "grid",
            `<path stroke="currentColor" fill="currentColor" d="m 34.375,0 h -25 c -5.1777344,0 -9.375,4.1972656 -9.375,9.375 v 25 c 0,5.175781 4.1972656,9.375 9.375,9.375 h 25 c 5.175781,0 9.375,-4.199219 9.375,-9.375 v -25 c 0,-5.1777344 -4.199219,-9.375 -9.375,-9.375 z m 56.25,56.25 h -25 c -5.175781,0 -9.375,4.199219 -9.375,9.375 v 25 c 0,5.177734 4.197266,9.375 9.375,9.375 h 25 c 5.177734,0 9.375,-4.197266 9.375,-9.375 v -25 c 0,-5.175781 -4.199219,-9.375 -9.375,-9.375 z m 0,-56.25 h -25 c -5.175781,0 -9.375,4.1972656 -9.375,9.375 v 25 c 0,5.175781 4.199219,9.375 9.375,9.375 h 25 c 5.175781,0 9.375,-4.199219 9.375,-9.375 v -25 c 0,-5.1777344 -4.199219,-9.375 -9.375,-9.375 z m -56.25,56.25 h -25 c -5.1777344,0 -9.375,4.199219 -9.375,9.375 v 25 c 0,5.175781 4.1972656,9.375 9.375,9.375 h 25 c 5.175781,0 9.375,-4.199219 9.375,-9.375 v -25 c 0,-5.175781 -4.199219,-9.375 -9.375,-9.375 z" />`
        );

        registerSettings(this);
        registerMarginalPostProcessor(this);
        registerMarginalMonkeyPatch(this);
        registerTitleBarLeafHook(this);
        registerLinkPostProcessor(this);
        registerLinkRenderingLivePreview(this);
        registerInlineFieldsHider(this);
        registerCodeEditorViews(this);
        registerCommands(this);
        registerFileCreationMenu(this);
    }

    onunload() {
        log.info("Unloading plugin");
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
