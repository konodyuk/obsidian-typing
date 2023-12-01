import { FnScript } from "src/scripting";
import { DataClass, field } from "src/utilities";
import { Note, NoteState, Type } from ".";

export enum HookNames {
    CREATE = "create",
    ON_CREATE = "on_create",
    // ON_OPEN = "on_open",
    // ON_CLOSE = "on_close",
    ON_RENAME = "on_rename",
    // ON_MOVE = "on_move",
    // ON_METADATA_CHANGE = "on_metadata_change",
    // ON_TYPE_CHANGE = "on_type_change",
}

export interface HookContext {}

export interface CreateHookContext extends HookContext {
    type: Type;
    state: NoteState;
}

export interface OnCreateHookContext extends HookContext {
    note: Note;
}

export interface OnOpenHookContext extends HookContext {
    note: Note;
}

export interface OnCloseHookContext extends HookContext {
    note: Note;
}

export interface OnRenameHookContext extends HookContext {
    note: Note;
    prevPath: string;
    prevFilename: string;
    prevFullname: string;
    prevTitle: string;
}

// export interface OnMoveHookContext extends HookContext {
//     note: Note;
//     prevPath: string;
// }

export interface OnTypeChangeHookContext extends HookContext {
    note: Note;
    prevType: Type;
}

export interface OnMetadataChangeHookContext extends HookContext {
    note: Note;
    fieldName: string;
    value: string;
    prevValue: string;
}

export class Hook<T extends HookContext> extends DataClass {
    @field()
    func: FnScript;

    run(ctx: T): Function {
        return this.func.call(ctx);
    }
}

export type HookContextType<T extends HookNames> = HookContainer[T] extends Hook<infer Ctx> ? Ctx : never;

export class HookContainer extends DataClass {
    @field()
    [HookNames.CREATE]: Hook<CreateHookContext> = null;
    @field()
    [HookNames.ON_CREATE]: Hook<OnCreateHookContext> = null;
    @field()
    [HookNames.ON_RENAME]: Hook<OnRenameHookContext> = null;
    // @field()
    // [HookNames.ON_MOVE]: Hook<OnMoveHookContext> = null;

    run<T extends HookNames, Ctx = HookContextType<T>>(name: T, context: Ctx) {
        const hook = this[name] as Hook<Ctx>;
        if (!hook) {
            return;
        }
        hook.run(context);
    }

    has<T extends HookNames>(name: T) {
        const hook = this[name];
        if (!hook) {
            return false;
        }
        return true;
    }
}
