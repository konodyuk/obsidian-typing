import { App, MarkdownView } from "obsidian";
import { DataviewApi } from "obsidian-dataview";
import TypingPlugin from "./main";
import { IncludeManager } from "./script/include_manager";
import { Note } from "./typing/note";
import { Registry } from "./typing/registry";

export class GlobalContext {
    app: App;
    plugin: TypingPlugin;
    registry: Registry;
    prism: any;
    include_manager: IncludeManager;

    get dv(): DataviewApi {
        return this.app.plugins.plugins.dataview.api;
    }
    get currentNote(): Note | null {
        let view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) {
            return null;
        }
        let note = new Note(view.file.path);
        return note;
    }

    setApp(app: App) {
        this.app = app;
    }
    setPlugin(plugin: TypingPlugin) {
        this.plugin = plugin;
    }
    setRegistry(registry: Registry) {
        this.registry = registry;
    }
    setPrism(prism: any) {
        this.prism = prism;
    }
}

export let ctx = new GlobalContext();
