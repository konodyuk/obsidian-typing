import { LiteralValue } from "obsidian-dataview";
import { registry, Type, StaticTypeAttributesMixin } from "src/type";
import { Action, Config } from "./config";
import { ctx } from "./context";
import { EvalContext } from "./eval";
import { autoFieldAccessor } from "./field_accessor";
import { promptName } from "./modals";

export class TypedNote extends StaticTypeAttributesMixin {
    conf: Config;
    path: string;
    type: Type | null;

    get fields(): Record<string, LiteralValue> {
        let dv = ctx.plugin.syncDataviewApi();
        return dv.page(this.path);
    }

    get folder(): string {
        let lastIndexOfPathSep = this.path.lastIndexOf("/");
        if (lastIndexOfPathSep != -1) {
            return this.path.slice(0, lastIndexOfPathSep);
        } else {
            return "";
        }
    }

    get name(): string {
        let lastIndexOfPathSep = this.path.lastIndexOf("/");

        // branching make for explicity
        if (lastIndexOfPathSep != -1) {
            return this.path.slice(
                lastIndexOfPathSep + 1,
                this.path.lastIndexOf(".")
            );
        } else {
            return this.path.slice(0, this.path.lastIndexOf("."));
        }
    }

    get actions(): Array<Action> {
        return this.type.actions;
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

            result = registry.applyOverrides(result);
        }

        return result;
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
        let evalCtx = new EvalContext(ctx.plugin.getDefaultContext(this));
        evalCtx.asyncEval(this.type.getActionByName(name).source);
    }
    async runPinnedAction(name: string) {
        let evalCtx = new EvalContext(ctx.plugin.getDefaultContext(this));
        evalCtx.asyncEval(this.conf.pinnedActions[name].source);
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
        let tmp = this.prefix.splitByPrefix(this.name);
        return promptName(tmp.prefix, tmp.name, this.conf);
    }
}
