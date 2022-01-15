import { TFile } from "obsidian";
import { LiteralValue } from "obsidian-dataview";
import { promptName } from "src/modals/prompt";
import { Type } from "src/typing/type";
import { ctx } from "../context";
import { autoFieldAccessor } from "../field_accessor";

export class Note {
    public type: Type | null;

    constructor(public path: string) {
        this.type = ctx.registry.byPath(path);
    }

    get fields(): Record<string, LiteralValue> {
        return ctx.dv.page(this.path);
    }

    get folder(): string {
        let lastIndexOfPathSep = this.path.lastIndexOf("/");
        if (lastIndexOfPathSep != -1) {
            return this.path.slice(0, lastIndexOfPathSep);
        } else {
            return "";
        }
    }

    get fullname(): string {
        let lastIndexOfPathSep = this.path.lastIndexOf("/");

        return this.path.slice(
            lastIndexOfPathSep + 1,
            this.path.lastIndexOf(".")
        );
    }

    get prefix(): string {
        if (this.type?.prefix) {
            return this.type.prefix.split(this.fullname).prefix;
        } else {
            return "";
        }
    }

    get name(): string {
        if (this.type?.prefix) {
            return this.type.prefix.split(this.fullname).name;
        } else {
            return this.fullname;
        }
    }

    async getField(name: string): Promise<string | null> {
        let fieldAccessor = await autoFieldAccessor(this.path, ctx.plugin);
        return await fieldAccessor.getValue(name);
    }
    async setField(name: string, value: string) {
        let fieldAccessor = await autoFieldAccessor(this.path, ctx.plugin);
        await fieldAccessor.setValue(name, value);
    }
    async runAction(name: string) {
        this.type.actions[name].script.run({ note: this });
    }
    async rename(name: string) {
        let vault = ctx.app.vault;
        let file = vault.getAbstractFileByPath(this.path);
        let newPath = `${this.folder}/${name}.md`;
        await vault.rename(file, newPath);
    }
    async move(path: string) {
        let vault = ctx.app.vault;
        let file = vault.getAbstractFileByPath(this.path);
        await vault.rename(file, path);
    }
    async promptName(): Promise<string> {
        if (this.type?.prefix) {
            let tmp = this.type.prefix.split(this.fullname);
            return promptName(tmp.prefix, tmp.name);
        } else {
            return promptName(null, this.fullname);
        }
    }
    async promptField(name: string): Promise<string> {
        if (this.type) {
            return await this.type.fields[name].prompt(
                await this.getField(name)
            );
        }
    }
}
