import { Plugin } from "obsidian";
import { TypingAPI } from "src/api";
import { importModules } from "src/api_imports";
import { registerCommands } from "src/commands";
import { gctx, GlobalContext } from "src/context";
import { registerCodeEditorViews } from "src/editor";
import {
    registerCssClassesHook,
    registerFileCreationMenu,
    registerInlineFieldsHider,
    registerLinkPostProcessor,
    registerLinkRenderingLivePreview,
    registerMarginalMonkeyPatch,
    registerMarginalPostProcessor,
    registerTitleBarLeafHook,
} from "src/middleware";
import { DEFAULT_SETTINGS, registerSettings, TEST_SETTINGS, TypingSettings } from "src/settings";
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

        this.ctx.noteCache.startWatch();

        if (gctx.testing) return;

        await this.ctx.cssManager.reloadFonts();

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
        registerCssClassesHook(this);
    }

    onunload() {
        log.info("Unloading plugin");
    }

    async loadSettings() {
        if (gctx.testing) {
            this.settings = TEST_SETTINGS;
            return;
        }
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
