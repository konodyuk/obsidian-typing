import { App, fuzzySearch, prepareQuery, SuggestModal } from "obsidian";
import { Fragment, h, render } from "preact";
import { ctx } from "src/context";
import { Action } from "../typing/action";
import { Note } from "../typing/note";

export function ActionSuggestion(props: {
    action: Action;
    callback: { (): void };
}) {
    let { action, callback } = props;
    let slug: JSX.Element;
    if (action.icon) {
        slug = <i className={action.icon}></i>;
    } else {
        slug = <></>;
    }
    return (
        <div className="typing-option-line" onClick={callback}>
            <div className="typing-option-line-pin">
                {action.is_pinned ? <i className="fa-regular fa-star"></i> : {}}
            </div>
            <div className="typing-option-line-slug">{slug}</div>
            <div className="typing-option-line-name">{action.name}</div>
        </div>
    );
}

export class ActionsSuggestModal extends SuggestModal<Action> {
    constructor(app: App, public actions: Array<Action>, public note: Note) {
        super(app);
    }
    async renderSuggestion(action: Action, el: HTMLElement) {
        return render(
            <ActionSuggestion action={action} callback={() => {}} />,
            el
        );
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
        this.note.runAction(action.name);
    }
}

export function openActions(path: string) {
    let note = new Note(path);
    let actions: { [name: string]: Action };
    if (note?.type?.actions) {
        actions = note.type.actions;
    } else {
        if (ctx.registry.actions) {
            actions = ctx.registry.actions;
        } else {
            actions = {};
        }
    }
    let normalActions: Array<Action> = [];
    let pinnedActions: Array<Action> = [];

    for (let actionName in actions) {
        let action = actions[actionName];
        if (action.is_pinned) {
            pinnedActions.push(action);
        } else {
            normalActions.push(action);
        }
    }

    new ActionsSuggestModal(
        ctx.app,
        [...pinnedActions, ...normalActions],
        note
    ).open();
}
