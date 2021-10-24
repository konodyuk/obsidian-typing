import { FieldSpec } from "./config_specs";
import { TypedNote } from "./typed_note";
import { Config } from "./config";

export abstract class FieldKind {
    abstract suggest(field: Field, note: TypedNote): void;
}
class AnyFieldKind extends FieldKind {
    suggest(field: Field, note: TypedNote) {}
}

let FIELD_KINDS = {
    any: new AnyFieldKind(),
};

export class Field {
    constructor(public name: string, public kind: string, public args?: any) {}
    static fromSpec(spec: FieldSpec, conf: Config): Field {
        let result = new Field(spec.name, spec.kind, spec.args);
        return result;
    }
}

export function registerFieldKind(kind: FieldKind) {}
