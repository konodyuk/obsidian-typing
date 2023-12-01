import styled from "@emotion/styled";
import { App, fuzzySearch, prepareQuery, SuggestModal } from "obsidian";
import { render } from "preact";
import { gctx } from "src/context";
import { Action, Note } from "src/typing";
import { Type } from "src/typing/type";

const Line = styled.div`
    display: flex;
    flex-direction: row;
`;

const Slug = styled.span`
    width: 2em;
`;

const Name = styled.span``;

export function SuggestionWithIcon(props: { text: string; icon: string; callback: { (): void } }) {
    let slug: JSX.Element;
    if (props.icon) {
        slug = <i className={props.icon}></i>;
    } else {
        slug = <></>;
    }
    return (
        <Line onClick={props.callback}>
            <Slug>{slug}</Slug>
            <Name>{props.text}</Name>
        </Line>
    );
}

export class TypeSuggestModal extends SuggestModal<Type> {
    types: Type[] = [];

    constructor(app: App, public callback: { (type: Type): void }, types?: string[]) {
        super(app);

        let typeNames = types ?? Object.keys(gctx.graph.types);
        for (let name of typeNames) {
            if (name.startsWith("_")) continue;
            let type = gctx.graph.get({ name });
            if (!type.isAbstract && type.isCreateable) {
                this.types.push(type);
            }
        }
    }
    renderSuggestion(type: Type, el: HTMLElement) {
        render(<SuggestionWithIcon text={type.name} icon={type.icon} callback={() => {}} />, el);
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

export class ActionSuggestModal extends SuggestModal<Action> {
    actions: Action[] = [];

    constructor(app: App, public note: Note) {
        super(app);

        for (let id in note.type.actions) {
            this.actions.push(note.type.actions[id]);
        }
    }
    renderSuggestion(action: Action, el: HTMLElement) {
        render(<SuggestionWithIcon text={action.name} icon={action.icon} callback={() => {}} />, el);
    }

    getSuggestions(query: string): Action[] {
        let preparedQuery = prepareQuery(query);
        let result = [];
        for (let action of this.actions) {
            if (fuzzySearch(preparedQuery, action.name)) {
                result.push(action);
            }
        }
        return result;
    }

    onChooseSuggestion(action: Action) {
        this.note.actions[action.id]();
    }
}
