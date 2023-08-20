import { TFile } from "obsidian";
import { gctx } from "src/context";
import TypingPlugin from "src/main";
import { DataClass, field } from "src/utilities";
import { Note } from "./note";

interface RelationSpec {
    from: string;
    to: string;
    type: string;
}

export interface Relation {
    from: Note;
    to: Note;
    type: string;
}

export class RelationsManager {
}

export class RelationsProxy extends DataClass {
    @field()
    note: Note;

    public get(filter?: { type?: string }): Relation[] { return [] }
}
