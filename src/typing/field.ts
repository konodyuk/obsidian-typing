import { FieldType } from "./field_type";

export class Field {
    constructor(public name: string, public type: FieldType) {}
    async prompt(oldValue?: string): Promise<string | null> {
        if (oldValue == null) {
            oldValue = "";
        }
        return this.type.prompt(this.name, oldValue);
    }
}
