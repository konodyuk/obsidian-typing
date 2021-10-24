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
import { TypeRegistry, Type } from "./type";
import { Field } from "./field";
import {
    TypeSuggestModal,
    SearchNoteSuggestModal,
    FieldSuggestModal,
} from "./search";
import { Config } from "./config";
import { registerTypeIconPostProcessor } from "./icon";

export default class TypingPlugin extends Plugin {
    config: Config;
    configPath: string = "typing.yaml.md";
    typeRegistry: TypeRegistry;

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
        registerTypeIconPostProcessor(this);

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

    async getType(path: string): Promise<Type> {
        return this.typeRegistry.getType(path);
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
        this.config = parseYaml(
            await this.app.vault.adapter.read(this.configPath)
        );
        this.typeRegistry.clear();
        this.typeRegistry.buildFromConfig(this.config);
    }
}
