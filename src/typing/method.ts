import { FnScript } from "src/scripting";
import { Bindable, DataClass, field } from "src/utilities";
import { Note } from ".";

export class MethodContext {
    note: Note;
}

export class Method extends DataClass implements Bindable<MethodContext, Function> {
    @field()
    function: FnScript;

    bind(ctx: MethodContext): Function {
        return this.function.call(ctx);
    }
}
