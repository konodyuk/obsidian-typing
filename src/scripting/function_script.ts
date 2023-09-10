import { Fragment, h } from "preact";
import { gctx } from "src/context";
import { Note } from "src/typing";
import { DataClass, field } from "src/utilities";
import { compileFunctionWithContext } from "./transpilation";

interface IScriptContextBase {
    note?: Note;
    _import_explicit?: typeof gctx.api._import_explicit;
}

export class Script<T extends IScriptContextBase = IScriptContextBase> extends DataClass {
    @field()
    source: string;

    fn: Function;

    @field()
    filePath: string = null;

    onAfterCreate() {
        this.source = this.transformSource(this.source);
        let transpiled = compileFunctionWithContext(this.source, { h, Fragment, api: gctx.api }, ["ctx", "note"]);
        if (transpiled instanceof Function) {
            this.fn = transpiled;
        } else {
            throw transpiled;
        }
    }

    transformSource(source: string) {
        return source;
    }

    call(ctx: T) {
        ctx._import_explicit = (path: string, symbols: string[]) =>
            gctx.api._import_explicit(path, symbols, this.filePath);
        return this.fn(ctx, ctx.note);
    }

    static validate(source: string) {
        return compileFunctionWithContext(source, {});
    }
}

export class FnScript<T extends IScriptContextBase = IScriptContextBase> extends Script<T> {}

export class ExprScript<T extends IScriptContextBase = IScriptContextBase> extends Script<T> {
    transformSource(source: string) {
        return `return (${source})`;
    }
}
