import { LiteralValue } from "obsidian-dataview";
import { registry, Type, StaticTypeAttributesMixin } from "src/type";
import { Action, Config } from "./config";
import { autoFieldAccessor } from "./field_accessor";

export class TypedNote extends StaticTypeAttributesMixin {
    conf: Config;
    path: string;
    type: Type;
    actions: Array<Action>;

    get fields(): Record<string, LiteralValue> {
        let dv = this.conf.plugin.syncDataviewApi();
        return dv.page(this.path);
    }

    get folder(): string {
        return this.path.slice(0, this.path.lastIndexOf("/"));
    }

    get name(): string {
        return this.path.slice(
            this.path.lastIndexOf("/") + 1,
            this.path.lastIndexOf(".")
        );
    }

    static fromPath(path: string, conf: Config): TypedNote {
        let type = registry.getTypeByPath(path);

        let result = new this();
        result.conf = conf;
        result.path = path;
        result.type = type;

        if (type) {
            result.header = type.header;
            result.footer = type.footer;
            result.icon = type.icon;
            result.render = type.render;
            result.prefix = type.prefix;

            result.actions = type.actions;
            result = registry.applyOverrides(result);
        }

        return result;
    }

    async getField(name: string): Promise<string | null> {
        let fieldAccessor = await autoFieldAccessor(
            this.path,
            this.conf.plugin
        );
        return await fieldAccessor.getValue(name);
    }
    async setField(name: string, value: string) {
        let fieldAccessor = await autoFieldAccessor(
            this.path,
            this.conf.plugin
        );
        await fieldAccessor.setValue(name, value);
    }
    async rename(name: string) {
        let vault = this.conf.plugin.app.vault;
        let file = vault.getAbstractFileByPath(this.path);
        let newPath = `${this.folder}/${name}.md`;
        await vault.rename(file, newPath);
    }
    async move(path: string) {
        let vault = this.conf.plugin.app.vault;
        let file = vault.getAbstractFileByPath(this.path);
        await vault.rename(file, path);
    }
}
