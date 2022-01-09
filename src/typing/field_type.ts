import { promptChoiceField, promptTextField } from "src/modals/prompt";

export abstract class FieldType {
    // abstract render(value: string, container: HTMLElement): void;
    abstract prompt(fieldName: string, oldValue: string): Promise<string>;
}
export abstract class AtomFieldType extends FieldType {}
export class ChoiceFieldType extends AtomFieldType {
    constructor(public options: Array<string>, public args: Array<String>) {
        super();
    }
    // render(value: string, container: HTMLElement): void {}
    async prompt(fieldName: string, oldValue: string): Promise<string> {
        return await promptChoiceField(fieldName, oldValue, this.options);
    }
}
export class NoteFieldType extends AtomFieldType {
    constructor(public options: Array<string>, public args: Array<String>) {
        super();
    }
    // render(value: string, container: HTMLElement): void {}
    async prompt(fieldName: string, oldValue: string): Promise<string> {
        return await promptTextField(fieldName, oldValue);
    }
}
export class TextFieldType extends AtomFieldType {
    // render(value: string, container: HTMLElement): void {}
    async prompt(fieldName: string, oldValue: string): Promise<string> {
        return await promptTextField(fieldName, oldValue);
    }
}
export class ListFieldType extends FieldType {
    constructor(public atom: AtomFieldType) {
        super();
    }
    // render(value: string, container: HTMLElement): void {}
    async prompt(fieldName: string, oldValue: string): Promise<string> {
        return await promptTextField(fieldName, oldValue);
    }
}
