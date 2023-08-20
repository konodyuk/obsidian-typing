import { Fragment, h } from "preact";
import { gctx } from "src/context";
import { Note } from "src/typing";
import { DataClass, field } from "src/utilities";
import { compileFunctionWithContext } from "./transpilation";

interface IScriptContextBase {
    note?: Note;
}

export class Script<T extends IScriptContextBase = IScriptContextBase> extends DataClass {
    @field()
    source: string;

    fn: Function;

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
