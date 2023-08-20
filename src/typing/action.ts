import { FnScript } from "src/scripting";
import { Bindable, DataClass, field } from "src/utilities";
import { Note } from ".";

export class ActionContext {
    note: Note;
}

export class Action extends DataClass implements Bindable<ActionContext, Function> {
    @field()
    public id: string;
    @field()
    public name: string;
    @field()
    public script: FnScript;
    @field()
    public shortcut?: string;
    @field()
    public icon?: string;
    @field()
    public pinned: boolean = false;

    bind(ctx: ActionContext) {
        return () => this.script.call(ctx);
    }
}
