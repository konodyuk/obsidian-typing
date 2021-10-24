import { TypeSpec, OverrideSpec } from "./config_specs";
import { EvalContext } from "./eval";
import { Field } from "./field";
import { Config, Marginal, Rendering, Action } from "./config";
import { TypedNote } from "./typed_note";
import { autoFieldAccessor } from "./field_accessor";
import { Prefix } from "./prefix";
import { gracefullyAlert } from "./utils";

export class StaticTypeAttributesMixin {
    header: Marginal;
    footer: Marginal;
    icon: string;
    render: Rendering;
    prefix: Prefix;
}

export class Type extends StaticTypeAttributesMixin {
    conf: Config;
    name: string;
    init: Array<string>;
    folder: string;
    fields: Array<Field>;
    actions: Array<Action>;
    prefix: Prefix;
    createable: boolean;
    private actionMapping: { [name: string]: Action };

    static async fromSpec(spec: TypeSpec, conf: Config): Promise<Type> {
        let result = new this();
        result.conf = conf;
        result.name = spec.name;
        result.folder = spec.folder;

        result.fields = [];
        if (spec.parents != null) {
            for (let parentName of spec.parents) {
                let parent = conf.types[parentName];
                if (parent == null) {
                    continue;
                }
                if (parent.header) {
                    result.header = parent.header;
                }
                if (parent.footer) {
                    result.footer = parent.footer;
                }
                if (parent.fields) {
                    result.fields.push(...parent.fields);
                }
            }
        }
        if (spec.header != null) {
            result.header = await Marginal.fromSpec(spec.header, conf);
        }
        if (spec.footer != null) {
            result.footer = await Marginal.fromSpec(spec.footer, conf);
        }
        if (spec.fields != null) {
            for (let fieldSpec of spec.fields) {
                let newField = Field.fromSpec(fieldSpec, conf);
                result.fields.push(newField);
            }
        }
        result.init = [];
        if (spec.init != null) {
            for (let field of spec.init) {
                // if (field != "name" && !(field in result.fields)) {
                //     gracefullyAlert(
                //         `unknown field in init of ${result.name}: ${field}`
                //     );
                //     continue;
                // }
                if (field in result.init) {
                    gracefullyAlert(
                        `duplicated field in init of ${result.name}: ${field}`
                    );
                    continue;
                }
                result.init.push(field);
            }
        }
        if (spec.icon != null) {
            result.icon = spec.icon;
        }
        if (spec.render != null) {
            result.render = await Rendering.fromSpec(spec.render, conf);
        }
        if (spec.prefix != null) {
            result.prefix = Prefix.fromString(spec.prefix);
        }
        result.createable = true;
        if (spec.createable != null) {
            result.createable = spec.createable;
        }
        result.actions = [];
        result.actionMapping = {};
        if (spec.actions) {
            for (let actionSpec of spec.actions) {
                let action;
                if (typeof actionSpec == "string") {
                    if (actionSpec in conf.actions) {
                        action = conf.actions[actionSpec];
                    } else {
                        gracefullyAlert(
                            `unknown action (${actionSpec}) in type: ${result.name}`
                        );
                        continue;
                    }
                } else {
                    action = await Action.fromSpec(actionSpec, conf);
                }
                result.actions.push(action);
                result.actionMapping[action.name] = action;
            }
        }
        return result;
    }

    getActionByName(name: string) {
        if (name in this.actionMapping) {
            return this.actionMapping[name];
        }
        gracefullyAlert(`unknown action: ${name}`);
    }

    async new(name?: string, fields?: { [name: string]: string }) {
        let vault = this.conf.plugin.app.vault;
        if (!vault.getAbstractFileByPath(this.folder)) {
            await vault.createFolder(this.folder);
        }
        if (!name && !this.prefix) {
            gracefullyAlert(
                `either name or prefix should be specified when creating type ${this.name}`
            );
            return;
        }

        if (!name) {
            name = "";
        }
        if (!fields) {
            fields = {};
        }
        let prefix = "";
        if (this.prefix) {
            prefix = this.prefix.new(this, name, fields);
        }

        let fullname = `${prefix} ${name}`.trim();
        let newPath = `${this.folder}/${fullname}.md`;
        console.log("creating", newPath);
        await vault.create(newPath, "");
        if (fields) {
            let accessor = await autoFieldAccessor(newPath, this.conf.plugin);
            for (let field in fields) {
                await accessor.setValue(field, fields[field]);
            }
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

export class Override {
    constructor(
        public conf: Config,
        public condition: string,
        public header?: Marginal,
        public footer?: Marginal,
        public icon?: string
    ) {}
    static async fromSpec(spec: OverrideSpec, conf: Config): Promise<Override> {
        let header = null;
        if (spec.header != null) {
            header = await Marginal.fromSpec(spec.header, conf);
        }

        let footer = null;
        if (spec.footer != null) {
            footer = await Marginal.fromSpec(spec.footer, conf);
        }

        let condition = spec.condition;
        if (condition && conf.settings?.preamble) {
            condition = conf.settings.preamble.source + ";" + condition;
        }

        return new this(conf, condition, header, footer, spec.icon);
    }
    check(note: TypedNote): boolean {
        let ctx = new EvalContext(this.conf.plugin.getDefaultContext(note));
        try {
            return ctx.eval(this.condition);
        } catch (e) {
            return false;
        }
    }
    apply(note: TypedNote) {
        if (this.header) {
            note.header = this.header;
        }
        if (this.footer) {
            note.footer = this.footer;
        }
        if (this.icon) {
            note.icon = this.icon;
        }
    }
}

export class TypeRegistry {
    public types: { [name: string]: Type } = {};
    public typesList: Array<Type> = [];
    public overrides: Array<Override> = [];
    public folderIndex: { [folder: string]: Type } = {};
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
        this.types[newType.name] = newType;
        this.folderIndex[newType.folder] = newType;
        this.typesList = Object.keys(this.types).map(
            (name) => this.types[name]
        );
    }
    addOverride(override: Override) {
        this.overrides.push(override);
    }
    getTypeByName(name: string): Type {
        return this.types[name];
    }
    getTypeByFolder(folder: string): Type | null {
        let type = this.folderIndex[folder];
        if (!type) {
            return null;
        }
        return type;
    }
    getTypeByPath(path: string): Type | null {
        let lastIndexOfPathSep = path.lastIndexOf("/");
        if (lastIndexOfPathSep == -1) {
            return null;
        }
        let folder = path.substring(0, lastIndexOfPathSep);

        let type = this.getTypeByFolder(folder);
        return type;
    }
    applyOverrides(note: TypedNote): TypedNote {
        for (let override of this.overrides) {
            if (override.check(note)) {
                override.apply(note);
            }
        }
        return note;
    }
    clear() {
        this.types = {};
        this.typesList = [];
        this.folderIndex = {};
        this.overrides = [];
    }
}

export let registry = new TypeRegistry();
