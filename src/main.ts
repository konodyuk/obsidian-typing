import {
    Plugin,
    TAbstractFile,
    MarkdownPostProcessorContext,
    parseYaml,
    Editor,
    MarkdownView,
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

export default class TypingPlugin extends Plugin {
    conf: Config;
    configPath: string = "typing.yaml.md";

    async onload() {
        console.log("Typing: loading");

        this.typeRegistry = new TypeRegistry(this);

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

        this.reloadConfig();
        this.setConfigReloader();

        // remove inline fields
        // TODO: move to obsidian-utilities
        this.registerMarkdownPostProcessor(
            (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
                let parNodes = el.querySelectorAll("p");
                for (let i = 0; i < parNodes.length; i++) {
                    let par = parNodes[i];
                    let parChildren = par.childNodes;
                    let childrenToRemove: Array<Node> = [];
                    for (let j = 0; j < parChildren.length; j++) {
                        let child = parChildren[j];
                        if (
                            child.nodeType == 3 &&
                            child.textContent.match(
                                /^\s*[0-9\w\p{Letter}][-0-9\w\p{Letter}]*\s*::/u
                            )
                        ) {
                            for (let k = j; k < parChildren.length; k++) {
                                childrenToRemove.push(parChildren[k]);
                                if (parChildren[k].nodeName == "BR") {
                                    break;
                                }
                            }
                        }
                    }
                    for (let child of childrenToRemove) {
                        par.removeChild(child);
                    }
                }
            }
        );
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
