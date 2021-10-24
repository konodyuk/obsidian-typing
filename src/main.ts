import {
    Plugin,
    TAbstractFile,
    parseYaml,
    MarkdownView,
    WorkspaceLeaf,
    addIcon,
    Platform,
} from "obsidian";
import { DataviewApi } from "obsidian-dataview";
import {
    registerMarginalsPostProcessors,
    monkeyPatchPreviewView,
} from "src/marginals";
import { registry } from "./type";
import { registerLinksPostProcessor } from "./link";
import { TypedNote } from "./typed_note";
import { Config } from "./config";
import { hideInlineFields } from "./utils";

export default class TypingPlugin extends Plugin {
    conf: Config;
    configPath: string = "typing.yaml.md";

    async onload() {
        console.log("Typing: loading");

        addIcon(
            "grid",
            `<path stroke="currentColor" fill="currentColor" d="m 34.375,0 h -25 c -5.1777344,0 -9.375,4.1972656 -9.375,9.375 v 25 c 0,5.175781 4.1972656,9.375 9.375,9.375 h 25 c 5.175781,0 9.375,-4.199219 9.375,-9.375 v -25 c 0,-5.1777344 -4.199219,-9.375 -9.375,-9.375 z m 56.25,56.25 h -25 c -5.175781,0 -9.375,4.199219 -9.375,9.375 v 25 c 0,5.177734 4.197266,9.375 9.375,9.375 h 25 c 5.177734,0 9.375,-4.197266 9.375,-9.375 v -25 c 0,-5.175781 -4.199219,-9.375 -9.375,-9.375 z m 0,-56.25 h -25 c -5.175781,0 -9.375,4.1972656 -9.375,9.375 v 25 c 0,5.175781 4.199219,9.375 9.375,9.375 h 25 c 5.175781,0 9.375,-4.199219 9.375,-9.375 v -25 c 0,-5.1777344 -4.199219,-9.375 -9.375,-9.375 z m -56.25,56.25 h -25 c -5.1777344,0 -9.375,4.199219 -9.375,9.375 v 25 c 0,5.175781 4.1972656,9.375 9.375,9.375 h 25 c 5.175781,0 9.375,-4.199219 9.375,-9.375 v -25 c 0,-5.175781 -4.199219,-9.375 -9.375,-9.375 z" />`
        );

        this.addCommand({
            id: "typing-find",
            name: "Find",
            editorCallback: (editor: Editor, view: MarkdownView) => {
                new TypeSuggestModal(
                    this.app,
                    this.typeRegistry,
                    async (type: Type) => {
                        new SearchNoteSuggestModal(
                            this.app,
                            this,
                            await this.dataviewApi(),
                            [type],
                            (page) => {
                                editor.replaceSelection(
                                    `[[${page.file.name}]]`
                                );
                            }
                        ).open();
                    }
                ).open();
            },
        });

        this.addCommand({
            id: "typing-new",
            name: "New",
            callback: () => {
                new TypeSuggestModal(
                    this.app,
                    this.typeRegistry,
                    async (type: Type) => {
                        let file = await type.createNewFile();
                        this.app.workspace.activeLeaf.openFile(file);
                    }
                ).open();
            },
        });

        this.addCommand({
            id: "typing-field",
            name: "Field",
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                let type = await this.getType(
                    this.app.workspace.getActiveFile().path
                );
                new FieldSuggestModal(
                    this.app,
                    this.typeRegistry,
                    type,
                    async (field: Field) => {
                        let value = field.getValue(editor);
                        await field.suggestOptions(
                            editor,
                            value,
                            (newValue: string, setCursor: boolean = false) => {
                                field.setValue(
                                    editor,
                                    newValue,
                                    type,
                                    setCursor
                                );
                            }
                        );
                    }
                ).open();
            },
        });

        registerMarginalsPostProcessors(this);
        monkeyPatchPreviewView(this);
        registerLinksPostProcessor(this);
        this.registerMarkdownPostProcessor(hideInlineFields);

        this.reloadConfig();
        this.setConfigReloader();

        this.app.workspace.onLayoutReady(this.processLeaves);
        this.app.workspace.on("layout-change", this.processLeaves);
    }

    processLeaves = () => {
        this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
            if (leaf.view.getViewType() != "markdown") {
                return;
            }
            let view = leaf.view as MarkdownView;
            let note = this.asTyped(view.file.path);

            this.addViewActionsMenu(view, note);
            this.setViewTitle(view, note);
        });
    };

    addViewActionsMenu(view: MarkdownView, note: TypedNote) {
        let actionsEl = view.containerEl.querySelector(
            ".view-actions"
        ) as HTMLElement;
        if (!actionsEl.querySelector(`a.view-action[aria-label="Actions"]`)) {
            view.addAction("grid", "Actions", () => {
                this.openActions(note);
            });
        }
    }

    openActions(note: TypedNote) {}

    setViewTitle(view: MarkdownView, note: TypedNote) {
        let titleContainerEl = view.containerEl.querySelector(
            ".view-header-title-container"
        ) as HTMLElement;

        while (titleContainerEl.firstChild) {
            titleContainerEl.removeChild(titleContainerEl.firstChild);
        }

        if (note.prefix) {
            let tmp = note.prefix.splitByPrefix(note.name);

            if (Platform.isMobileApp) {
                if (!tmp.name) {
                    titleContainerEl.createDiv({
                        cls: "view-header-title typing-note-prefix",
                    }).innerText = tmp.prefix;
                } else {
                    titleContainerEl.createDiv({
                        cls: "view-header-title typing-note-name",
                    }).innerText = tmp.name;
                }
            } else {
                titleContainerEl.createDiv({
                    cls: "view-header-title typing-note-prefix",
                }).innerText = tmp.prefix;
                titleContainerEl.createDiv({
                    cls: "view-header-title typing-note-name",
                }).innerText = tmp.name;
            }
            titleContainerEl.onclick = (e) => {
                console.log("editing name of", note.name);
            };
        } else {
            titleContainerEl.createDiv({
                cls: "view-header-title",
            }).innerText = note.name;
            titleContainerEl.onclick = (e) => {
                console.log("editing name of", note.name);
            };
        }
    }

    asTyped(path: string): TypedNote | null {
        return TypedNote.fromPath(path, this.conf);
    }

    getDefaultContext(note: TypedNote) {
        return {
            dv: this.syncDataviewApi(),
            plugin: this,
            app: this.app,
            note: note,
            type: note.type,
            TypedNote: TypedNote,
            registry: registry,
        };
    }

    onunload() {
        console.log("Typing: unloading");
        this.app.workspace.off("layout-change", this.processLeaves);
    }

    async asyncDataviewApi(): Promise<DataviewApi> {
        let dvPlugin = this.app.plugins.plugins.dataview;
        if (dvPlugin.api) {
            return dvPlugin.api;
        }
        return await new Promise((resolve) => {
            this.app.metadataCache.on(
                "dataview:api-ready",
                (api: DataviewApi) => {
                    resolve(api);
                }
            );
        });
    }

    syncDataviewApi(): DataviewApi {
        return this.app.plugins.plugins.dataview.api;
    }

    setConfigReloader() {
        this.registerEvent(
            this.app.vault.on("modify", (file: TAbstractFile) => {
                if (file.path === this.configPath) {
                    this.reloadConfig();
                }
            })
        );
    }

    async reloadConfig() {
        let configSpec = parseYaml(
            await this.app.vault.adapter.read(this.configPath)
        );
        this.conf = await Config.fromSpec(configSpec, this);
    }
}
