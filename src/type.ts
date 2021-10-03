import { Notice, TFile, MarkdownRenderer } from "obsidian";
import TypingPlugin from "./main";
import {
    MarginalSpec,
    IconSpec,
    Config,
    RenderingSpec,
    TextSpec,
} from "./config";
import { ScriptContext } from "./eval";
import { LiteralValue } from "obsidian-dataview";
import { Field } from "./field";

export class Type {
    constructor(
        public registry: TypeRegistry,
        public name: string,
        public folder: string,
        public parents: Array<Type>,
        public fields?: Array<Field>,
        public header?: MarginalSpec,
        public footer?: MarginalSpec,
        public icon?: IconSpec,
        public rendering?: RenderingSpec
    ) {}
    consolidateProperties() {
        let fields: Array<Field> = [];
        for (let parent of this.parents) {
            if (!this.header && parent.header) {
                this.header = parent.header;
            }
            if (!this.footer && parent.footer) {
                this.footer = parent.footer;
            }
            if (parent.fields) {
                fields.push(...parent.fields);
            }
        }
        if (this.fields) {
            fields.push(...this.fields);
        }
        this.fields = fields;
    }
    createNewFile(): Promise<TFile> {
        let vault = this.registry.plugin.app.vault;
        if (!vault.getAbstractFileByPath(this.folder)) {
            vault.createFolder(this.folder);
        }
        let serial = 0;
        while (
            vault.getAbstractFileByPath(this.folder + `/Untitled${serial}.md`)
        ) {
            serial++;
        }
        return vault.create(this.folder + `/Untitled${serial}.md`, "");
    }
    // TODO: use render(mode=link) as a generic substitution of typeIconPostProcessor
    async render(
        page: Record<string, LiteralValue>,
        mode: "link" | "card",
        containerEl: HTMLElement
    ) {
        if (
            !this.rendering ||
            (mode == "link" && !this.rendering.link) ||
            (mode == "card" && !this.rendering.card)
        ) {
            let tempContainerEl = document.createElement("div");
            MarkdownRenderer.renderMarkdown(
                `[[${page.file.path}|${page.file.name}]]`,
                tempContainerEl,
                "",
                null
            );
            containerEl.appendChild(tempContainerEl.firstChild.firstChild);
            tempContainerEl.removeChild(tempContainerEl.firstChild);
            return;
        }

        let scriptContext = new ScriptContext(
            await this.registry.plugin.dataviewApi(),
            "",
            containerEl,
            this,
            page
        );

        if (mode == "link") {
            return scriptContext.evalScript(this.rendering.link.value);
        }
        if (mode == "card") {
            return scriptContext.evalScript(this.rendering.card.value);
        }
    }
    getFieldOrder(): { [name: string]: number } {
        let result: { [name: string]: number } = {};
        if (!this.fields) {
            return result;
        }
        for (let i = 0; i < this.fields.length; i++) {
            result[this.fields[i].name] = i;
        }
        return result;
    }
}

class Override {
    constructor(
        public registry: TypeRegistry,
        public condition: string,
        public header?: MarginalSpec,
        public footer?: MarginalSpec,
        public icon?: IconSpec
    ) {}
    async check(path: string, type: Type): Promise<boolean> {
        let scriptContext = new ScriptContext(
            await this.registry.plugin.dataviewApi(),
            path,
            null,
            type
        );
        try {
            // TODO: fix overrides aren't checked correctly until DV index is built
            return scriptContext.evalScript(this.condition);
        } catch (e) {
            return false;
        }
    }
    apply(type: Type) {
        if (this.header) {
            type.header = this.header;
        }
        if (this.footer) {
            type.footer = this.footer;
        }
        if (this.icon) {
            type.icon = this.icon;
        }
    }
}

export class TypeRegistry {
    types: { [name: string]: Type } = {};
    typesList: Array<Type> = [];
    overrides: Array<Override> = [];
    folderIndex: { [folder: string]: Type } = {};
    isEmpty: boolean = true;
    constructor(public plugin: TypingPlugin) {}
    addType(newType: Type) {
        for (let name in this.types) {
            if (name == newType.name) {
                gracefullyAlert("duplicate type name: " + name);
                return;
            }
            if (this.types[name].folder == newType.folder) {
                gracefullyAlert("duplicate type folder: " + newType.folder);
                return;
            }
        }
        newType.consolidateProperties();
        this.types[newType.name] = newType;
    }
    clear() {
        this.isEmpty = true;
        this.types = {};
        this.typesList = [];
        this.folderIndex = {};
        this.overrides = [];
    }
    async buildFromConfig(config: Config) {
        if (!this.isEmpty) {
            this.clear();
            this.isEmpty = false;
        }
        let preamble = "";
        if (config.preamble) {
            preamble = config.preamble + ";\n";
        }
        for (let typeSpec of config.types) {
            let parents = [];
            if (typeSpec.parents) {
                for (let parent of typeSpec.parents) {
                    if (!(parent in this.types)) {
                        gracefullyAlert("undefined parent: " + parent);
                        return;
                    }
                    parents.push(this.types[parent]);
                }
            }
            let header = typeSpec.header;
            if (header) {
                this.ensureCorrectMarginalSpec(header, preamble);
            }
            let icon = typeSpec.icon;
            if (icon) {
                this.ensureCorrectIcon(icon);
            }
            let footer = typeSpec.footer;
            if (footer) {
                this.ensureCorrectMarginalSpec(footer, preamble);
            }
            let rendering = typeSpec.render;
            if (rendering) {
                if (rendering.card) {
                    this.ensureCorrectTextSpec(rendering.card);
                }
                if (rendering.link) {
                    this.ensureCorrectTextSpec(rendering.link);
                }
            }
            let fields = [];
            if (typeSpec.fields) {
                for (let field of typeSpec.fields) {
                    fields.push(
                        new Field(
                            this,
                            field.name,
                            field.kind,
                            field.types,
                            field.options
                        )
                    );
                }
            }
            let type = new Type(
                this,
                typeSpec.name,
                typeSpec.folder,
                parents,
                fields,
                header,
                footer,
                icon,
                rendering
            );
            this.addType(type);
        }
        for (let name in this.types) {
            let type = this.types[name];
            this.folderIndex[type.folder] = type;
        }
        this.typesList = Object.keys(this.types).map(
            (name) => this.types[name]
        );
        for (let overrideSpec of config.overrides) {
            let condition = overrideSpec.condition;
            condition = preamble + condition;

            let header = overrideSpec.header;
            if (header) {
                this.ensureCorrectMarginalSpec(header, preamble);
            }
            let icon = overrideSpec.icon;
            if (icon) {
                this.ensureCorrectIcon(icon);
            }
            let footer = overrideSpec.footer;
            if (footer) {
                this.ensureCorrectMarginalSpec(footer, preamble);
            }
            let override = new Override(this, condition, header, footer, icon);
            this.overrides.push(override);
        }
    }
    async getType(path: string): Promise<Type> {
        let lastIndexOfPathSep = path.lastIndexOf("/");
        if (lastIndexOfPathSep == -1) {
            return;
        }

        let folder = path.substring(0, lastIndexOfPathSep);
        let type = this.folderIndex[folder];
        if (!type) {
            return;
        }
        let isCloned = false;
        for (let override of this.overrides) {
            if (await override.check(path, type)) {
                if (!isCloned) {
                    type = Object.create(type);
                    isCloned = true;
                }
                override.apply(type);
            }
        }
        return type;
    }
    async ensureCorrectTextSpec(textSpec: TextSpec) {
        if (textSpec.value && textSpec.file) {
            gracefullyAlert(
                `both value and file are specified in TextSpec: ${textSpec.file}`
            );
            textSpec.file = null;
        }
        if (textSpec.file) {
            textSpec.value = await this.plugin.app.vault.adapter.read(
                textSpec.file
            );
        }
    }
    async ensureCorrectMarginalSpec(marginal: MarginalSpec, preamble: string) {
        await this.ensureCorrectTextSpec(marginal);
        if (!marginal.kind) {
            marginal.kind = "js";
        }
        if (marginal.kind == "js") {
            marginal.value = preamble + marginal.value;
        }
    }
    ensureCorrectIcon(icon: IconSpec) {
        if (!icon.kind) {
            icon.kind = "fa";
        }
    }
}

function gracefullyAlert(message: string) {
    new Notice("Typing: " + message);
    console.log("Typing: " + message);
}
