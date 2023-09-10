import { App, PluginSettingTab, Setting, TFile, TFolder, Vault } from "obsidian";
import { useState } from "react";
import ReactDOM from "react-dom";
import TypingPlugin from "src/main";
import { Combobox } from "src/ui";

export interface TypingSettings {
    schemaPath: string;
    jsImportsPath: string;
    otlImportsPath: string;
    marginalsInPreview: boolean;
    marginalsInLivePreview: boolean;
    linksInPreview: boolean;
    linksInLivePreview: boolean;
    enableScripting: boolean;
    enabledFonts: string[];
}

export const DEFAULT_SETTINGS: TypingSettings = {
    schemaPath: "typing.otl",
    jsImportsPath: "/",
    otlImportsPath: "/",
    marginalsInPreview: true,
    marginalsInLivePreview: false,
    linksInPreview: true,
    linksInLivePreview: true,
    enableScripting: false,
    enabledFonts: [],
};

export const TEST_SETTINGS: TypingSettings = {
    ...DEFAULT_SETTINGS,
    enableScripting: true,
};

class TypingSettingTab extends PluginSettingTab {
    plugin: TypingPlugin;

    constructor(app: App, plugin: TypingPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    get settings() {
        return this.plugin.settings;
    }
    async saveSettings() {
        await this.plugin.saveSettings();
    }

    display(): void {
        let { containerEl } = this;

        containerEl.empty();

        containerEl.createEl("h2").innerText = "Safety";
        new Setting(containerEl)
            .setName("Enable JS scripting")
            .setDesc(
                "Enables JS/TS code execution for React-based headers, footers, internal links, note actions, methods, and lifecycle hooks. " +
                    "If you enable this setting, be sure to check all the OTL and JS/TS code you import and use."
            )
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.enableScripting);
                toggle.onChange(async (value: boolean) => {
                    this.plugin.settings.enableScripting = value;
                    await this.plugin.saveSettings();
                });
            });

        containerEl.createEl("h2").innerText = "Paths";
        ReactDOM.render(
            <FileSuggestionCombobox
                paths={getAllDirs}
                value={this.plugin.settings.otlImportsPath}
                onSetValue={async (value: string) => {
                    this.plugin.settings.otlImportsPath = value;
                    await this.plugin.saveSettings();
                }}
            />,
            new Setting(containerEl).setName("OTL Imports Path").setDesc("Directory containing all OTL files").controlEl
        );
        ReactDOM.render(
            <FileSuggestionCombobox
                paths={getAllDirs}
                value={this.plugin.settings.jsImportsPath}
                onSetValue={async (value: string) => {
                    this.plugin.settings.jsImportsPath = value;
                    await this.plugin.saveSettings();
                }}
            />,
            new Setting(containerEl).setName("JS Imports Path").setDesc("Directory containing all JS/TS/JSX/TSX files")
                .controlEl
        );
        ReactDOM.render(
            <FileSuggestionCombobox
                paths={getAllOTLFiles}
                value={this.plugin.settings.schemaPath}
                onSetValue={async (value: string) => {
                    this.plugin.settings.schemaPath = value;
                    await this.plugin.saveSettings();
                }}
            />,
            new Setting(containerEl).setName("Schema Path").setDesc("Main OTL file containing all types for this vault")
                .controlEl
        );

        containerEl.createEl("h2").innerText = "Style";
        new Setting(containerEl).setName("Headers & Footers: Preview Mode").addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.marginalsInPreview);
            toggle.onChange(async (value: boolean) => {
                this.plugin.settings.marginalsInPreview = value;
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl).setName("Headers & Footers: Live Preview Mode").addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.marginalsInLivePreview);
            toggle.setDisabled(true);
            toggle.onChange(async (value: boolean) => {
                this.plugin.settings.marginalsInLivePreview = value;
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl).setName("React Links: Preview Mode").addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.linksInPreview);
            toggle.onChange(async (value: boolean) => {
                this.plugin.settings.linksInPreview = value;
                await this.plugin.saveSettings();
            });
        });
        new Setting(containerEl).setName("React Links: Live Preview Mode").addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.linksInLivePreview);
            toggle.onChange(async (value: boolean) => {
                this.plugin.settings.linksInLivePreview = value;
                await this.plugin.saveSettings();
            });
        });

        containerEl.createEl("h2").innerText = "Icon Fonts";
        new Setting(containerEl).setName("Enable FontAwesome Free").addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.enabledFonts.includes("fontawesome"));
            toggle.onChange(async (value: boolean) => {
                if (value) {
                    this.plugin.settings.enabledFonts.push("fontawesome");
                } else {
                    this.plugin.settings.enabledFonts.remove("fontawesome");
                }
                this.plugin.settings.enabledFonts = this.plugin.settings.enabledFonts.unique();
                await this.plugin.saveSettings();
                await gctx.cssManager.reloadFonts();
            });
        });
        new Setting(containerEl).setName("Enable Lucide").addToggle((toggle) => {
            toggle.setValue(this.plugin.settings.enabledFonts.includes("lucide"));
            toggle.onChange(async (value: boolean) => {
                if (value) {
                    this.plugin.settings.enabledFonts.push("lucide");
                } else {
                    this.plugin.settings.enabledFonts.remove("lucide");
                }
                this.plugin.settings.enabledFonts = this.plugin.settings.enabledFonts.unique();
                await this.plugin.saveSettings();
                await gctx.cssManager.reloadFonts();
            });
        });
    }
}
export function registerSettings(plugin: TypingPlugin) {
    plugin.addSettingTab(new TypingSettingTab(plugin.app, plugin));
}

function getAllDirs() {
    let folder = app.vault.getRoot();
    let folders: string[] = [];
    Vault.recurseChildren(folder, (tfile) => {
        if (!(tfile instanceof TFolder)) return;
        let path = tfile.path;
        if (!path.startsWith("/")) path = "/" + path;
        folders.push(path);
    });
    return folders;
}

function getAllOTLFiles() {
    let folder = app.vault.getRoot();
    let files: string[] = [];
    Vault.recurseChildren(folder, (tfile) => {
        if (!(tfile instanceof TFile)) return;
        let path = tfile.path;
        if (!path.endsWith(".otl")) return;
        files.push(path);
    });
    return files;
}

const FileSuggestionCombobox = ({ value: initialValue, paths, onSetValue }) => {
    let [value, setValue] = useState(initialValue);
    return (
        <div
            style={{
                border: "1px solid var(--background-modifier-border)",
                borderRadius: "var(--radius-s)",
                // width: "100%",
            }}
        >
            <Combobox
                open={false}
                value={value}
                options={paths().map((value) => ({ value }))}
                onSetValue={(value) => {
                    setValue(value);
                    onSetValue(value);
                }}
            />
        </div>
    );
};
