import { ctx } from "src/context";
import { autoFieldAccessor } from "src/field_accessor";
import { CompilationError, NodeLike } from "src/language/grammar";
import { warn } from "src/utils";
import { promptName } from "../modals/prompt";
import { Script } from "../script";
import { Action } from "./action";
import { Field } from "./field";
import { Note } from "./note";
import { Prefix } from "./prefix";
import { Appearance, IconValue, Settings } from "./value";

export interface TypeArguments {
    is_abstract: boolean;
    name: String & NodeLike;
    parents: Array<String & NodeLike>;
    folder: String & NodeLike;
    icon: String & NodeLike;
    prefix: Prefix & NodeLike;
    initializer: Script & NodeLike;
    appearance: Appearance & NodeLike;
    fields: Record<string, Field & NodeLike>;
    actions: Record<string, Action & NodeLike>;
    settings: Settings & NodeLike;
}

export class Type {
    constructor(
        public is_abstract: boolean,
        public name: string,
        public parents: Array<string>,
        public folder: string,
        public icon: string,
        public prefix: Prefix,
        public initializer: Script,
        public appearance: Appearance,
        public fields: { [name: string]: Field },
        public actions: { [name: string]: Action },
        public settings: Settings,
        public args: TypeArguments
    ) {}

    static fromArguments(args: TypeArguments) {
        let {
            is_abstract,
            name,
            parents,
            folder,
            icon,
            prefix,
            initializer,
            appearance,
            fields,
            actions,
            settings,
        } = args;

        if (is_abstract == null) {
            is_abstract = false;
        }
        if (folder == null && !is_abstract) {
            throw new CompilationError({
                msg: "Folder should be specified on non-abstract file.",
                node: args.name,
            });
        }
        if (parents == null) {
            parents = [];
        }
        if (prefix == null) {
            prefix = null;
        }
        if (appearance == null) {
            appearance = new Appearance() as Appearance & NodeLike;
        }
        if (appearance.icon != null && appearance.link != null) {
            throw new CompilationError({
                msg: "Only one of icon and link can be specified.",
                node: args.appearance,
            });
        }
        if (
            appearance.link == null &&
            appearance.icon == null &&
            icon != null
        ) {
            appearance.icon = new IconValue(icon.valueOf());
        }
        if (fields == null) {
            fields = {};
        }
        if (actions == null) {
            actions = {};
        }

        return new Type(
            is_abstract,
            name.valueOf(),
            parents.map((value) => value.valueOf()),
            folder?.valueOf(),
            icon?.valueOf(),
            prefix,
            initializer,
            appearance,
            fields,
            actions,
            settings,
            args
        );
    }

    inherit(parent: Type) {
        if (this.icon == null && parent.icon != null) {
            this.icon = parent.icon;
        }
        if (this.appearance.icon == null && parent.appearance.icon != null) {
            this.appearance.icon = parent.appearance.icon;
        }
        if (this.appearance.link == null && parent.appearance.link != null) {
            this.appearance.link = parent.appearance.link;
        }
        if (
            this.appearance.footer == null &&
            parent.appearance.footer != null
        ) {
            this.appearance.footer = parent.appearance.footer;
        }
        if (
            this.appearance.header == null &&
            parent.appearance.header != null
        ) {
            this.appearance.header = parent.appearance.header;
        }
        this.fields = { ...parent.fields, ...this.fields };
        this.actions = { ...parent.actions, ...this.actions };
    }

    /**
     * public interface, does not prompt anything, just creates the note
     * @param name note name
     * @param fields field values in string format
     */
    async new(
        name?: string,
        fields?: { [name: string]: string }
    ): Promise<Note> {
        if (!name && !this.prefix) {
            warn(
                `Could not create note of type ${this.name}, since it doesn't 
                have a default prefix and name wasn't provided.`
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
            prefix = this.prefix.new(this);
        }

        let vault = ctx.app.vault;
        if (!vault.getAbstractFileByPath(this.folder)) {
            await vault.createFolder(this.folder);
        }

        let fullname = `${prefix} ${name}`.trim();
        let newPath = `${this.folder}/${fullname}.md`;
        await ctx.app.vault.create(newPath, "");
        if (fields) {
            let accessor = await autoFieldAccessor(newPath, ctx.plugin);
            for (let fieldName in fields) {
                await accessor.setValue(fieldName, fields[fieldName]);
            }
        }

        return new Note(newPath);
    }

    /**
     * Invokes custom init function if it exists or prompts every field.
     * Method .new() is never invoked internally, ._new() is used instead.
     * @returns created note
     */
    async _new(): Promise<Note> {
        let note = null;
        if (this.initializer != null) {
            note = await this.initializer
                .run({
                    type: this,
                })
                .catch((reason) =>
                    console.log(
                        `Error creating class ${this.name} with custom initializer: ${reason}\n\nFallback to default initializer`
                    )
                );
        }

        if (!note) {
            let { name, fields } = await this.prompt();
            note = await this.new(name, fields);
        }
        return note;
    }
    async promptName(): Promise<string> {
        return await promptName("", "");
    }
    async promptField(name: string): Promise<string> {
        return await this.fields[name].prompt();
    }
    async promptFields(
        names: Array<string> | "all"
    ): Promise<Record<string, string>> {
        let result: Record<string, string> = {};
        if (names == "all") {
            for (let key in this.fields) {
                let value = await this.promptField(key);
                if (value == null) {
                    continue;
                }
                result[key] = value;
            }
        } else {
            for (let key of names) {
                let value = await this.promptField(key);
                if (value == null) {
                    continue;
                }
                result[key] = value;
            }
        }
        return result;
    }
    async prompt(
        name: boolean = true,
        fields: Array<string> | "all" = "all"
    ): Promise<{ name?: string; fields?: Record<string, string> }> {
        let result: { name?: string; fields?: Record<string, string> } = {};
        if (name) {
            result.name = await this.promptName();
        }
        result.fields = await this.promptFields(fields);
        return result;
    }
}
