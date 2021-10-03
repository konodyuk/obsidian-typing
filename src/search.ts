import {
    FuzzySuggestModal,
    SuggestModal,
    fuzzySearch,
    prepareQuery,
    App,
} from "obsidian";
import { TypeRegistry, Type } from "./type";
import { Field } from "./field";
import { LiteralValue, DataviewApi } from "obsidian-dataview";
import TypingPlugin from "./main";

export class TypeSuggestModal extends FuzzySuggestModal<Type> {
    constructor(
        app: App,
        public registry: TypeRegistry,
        public callback: { (type: Type): void }
    ) {
        super(app);
    }
    getItems(): Type[] {
        return this.registry.typesList;
    }
    getItemText(type: Type) {
        return type.name;
    }
    onChooseItem(type: Type) {
        this.callback(type);
    }
}

export class FieldSuggestModal extends FuzzySuggestModal<Field> {
    constructor(
        app: App,
        public registry: TypeRegistry,
        public type: Type,
        public callback: { (field: Field): void }
    ) {
        super(app);
    }
    getItems(): Field[] {
        return this.type.fields;
    }
    getItemText(field: Field) {
        return field.name;
    }
    onChooseItem(field: Field) {
        this.callback(field);
    }
}

export class StringSuggestModal extends FuzzySuggestModal<string> {
    constructor(
        app: App,
        public strings: string[],
        public callback: { (s: string): void }
    ) {
        super(app);
    }
    getItems(): string[] {
        return this.strings;
    }
    getItemText(s: string) {
        return s;
    }
    onChooseItem(s: string) {
        this.callback(s);
    }
}

abstract class TypedSearchSuggestModal extends SuggestModal<
    Record<string, LiteralValue>
> {
    typeFolders: Array<string>;
    dvQuery: string;
    pages;
    constructor(
        app: App,
        public plugin: TypingPlugin,
        public api: DataviewApi,
        public types: Array<Type>
    ) {
        super(app);
        this.typeFolders = [];
        for (let type of this.types) {
            this.typeFolders.push(`"${type.folder}"`);
        }
        this.dvQuery = this.typeFolders.join(" or ");
        this.pages = this.api.pages(this.dvQuery);
    }
    async renderSuggestion(
        page: Record<string, LiteralValue>,
        el: HTMLElement
    ) {
        (await this.plugin.getType(page.file.path)).render(page, "card", el);
    }

    getSuggestions(query: string): Record<string, LiteralValue>[] {
        let result = [];
        let createQueryFunction = (query: string) => {
            return (p: Record<string, LiteralValue>) => {
                function has(s: string) {
                    let { file, ...fields } = p;
                    let metadataString = JSON.stringify(fields).toLowerCase();
                    s = s.trim().toLowerCase();
                    return metadataString.contains(s);
                }
                let name = p.file.name;

                try {
                    // try to eval as JS code
                    return eval(query);
                } catch (e) {
                    let nameMatchingResult = fuzzySearch(
                        prepareQuery(query),
                        name
                    );
                    try {
                        // search as a metadata substring
                        return eval(`has("${query}")`) || nameMatchingResult;
                    } catch (e) {
                        // show all results
                        return nameMatchingResult;
                    }
                }
            };
        };
        let filteredPages = this.pages;
        if (query) {
            filteredPages = filteredPages.where(createQueryFunction(query));
        }
        for (let value of filteredPages) {
            result.push(value);
        }
        return result;
    }
}

export class SearchNoteSuggestModal extends TypedSearchSuggestModal {
    constructor(
        app: App,
        plugin: TypingPlugin,
        api: DataviewApi,
        types: Array<Type>,
        public callback: { (page: Record<string, LiteralValue>): void }
    ) {
        super(app, plugin, api, types);
    }
    onChooseSuggestion(page: Record<string, LiteralValue>) {
        this.callback(page);
    }
}

export class SearchNoteListSuggestModal extends TypedSearchSuggestModal {
    constructor(
        app: App,
        plugin: TypingPlugin,
        api: DataviewApi,
        types: Array<Type>,
        public callback: { (page: Array<Record<string, LiteralValue>>): void },
        public result?: Array<Record<string, LiteralValue>>
    ) {
        super(app, plugin, api, types);
        if (!this.result) {
            this.result = [];
        }
    }
    onChooseSuggestion(page: Record<string, LiteralValue>) {
        this.result.push(page);
        new SearchNoteListSuggestModal(
            this.app,
            this.plugin,
            this.api,
            this.types,
            this.callback,
            this.result
        ).open();
    }
    onClose() {
        this.callback(this.result);
    }
}
