import {
    App,
    fuzzySearch,
    FuzzySuggestModal,
    prepareQuery,
    SuggestModal,
} from "obsidian";
import { Fragment, h, render } from "preact";
import { ctx } from "src/context";
import { Type } from "../typing/type";

export function TypeSuggestion(props: { type: Type; callback: { (): void } }) {
    let { type, callback } = props;
    let slug: JSX.Element;
    if (type.icon) {
        slug = <i className={type.icon}></i>;
    } else {
        slug = <></>;
    }
    return (
        <div className="typing-option-line" onClick={callback}>
            <div className="typing-option-line-slug">{slug}</div>
            <div className="typing-option-line-name">{type.name}</div>
        </div>
    );
}

export class TypeSuggestModal extends SuggestModal<Type> {
    types: Type[] = [];

    constructor(app: App, public callback: { (type: Type): void }) {
        super(app);

        for (let name in ctx.registry.types) {
            let type = ctx.registry.byName(name);
            if (!type.is_abstract) {
                this.types.push(type);
            }
        }
    }
    async renderSuggestion(type: Type, el: HTMLElement) {
        return render(<TypeSuggestion type={type} callback={() => {}} />, el);
    }

    getSuggestions(query: string): Type[] {
        let preparedQuery = prepareQuery(query);
        let result = [];
        for (let type of this.types) {
            if (fuzzySearch(preparedQuery, type.name)) {
                result.push(type);
            }
        }
        return result;
    }

    onChooseSuggestion(type: Type) {
        this.callback(type);
    }
}

export class FieldSuggestModal extends FuzzySuggestModal<string> {
    constructor(
        app: App,
        public options: Array<string>,
        public callback: { (choice: string | null): void }
    ) {
        super(app);
    }
    getItems(): string[] {
        return this.options;
    }
    getItemText(s: string) {
        return s;
    }
    onChooseItem(s: string) {
        this.callback(s);
    }
}
