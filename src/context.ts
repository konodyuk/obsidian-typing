import { App } from "obsidian";
import TypingPlugin from "./main";

class GlobalContext {
    app: App;
    plugin: TypingPlugin;

    setApp(app: App) {
        this.app = app;
    }
    setPlugin(plugin: TypingPlugin) {
        this.plugin = plugin;
    }
}

export let ctx = new GlobalContext();
