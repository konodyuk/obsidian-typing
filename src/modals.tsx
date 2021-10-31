import {
    App,
    fuzzySearch,
    FuzzySuggestModal,
    Modal,
    prepareQuery,
    SuggestModal,
} from "obsidian";
import { Action, Config } from "./config";
import { PrefixComponent } from "./components/prefix";
import React from "react";
import ReactDOM from "react-dom";
import { ctx } from "./context";
import { TextArea } from "./components/textarea";
import { ActionCard, ActionLine } from "./components/action";
import { TypedNote } from "./typed_note";
import { registry, Type } from "./type";

export async function promptName(
    prefix: string | null,
    oldName: string | null,
    conf: Config
): Promise<string | null> {
    if (prefix == null) {
        prefix = "";
    }
    if (oldName == null) {
        oldName = "";
    }
    return new Promise((resolve) => {
        new NamePromptModal(ctx.app, prefix, oldName, (name) => {
            if (name === null) {
                resolve(null);
            }
            resolve(`${prefix} ${name}`.trim());
        }).open();
    });
}

export async function promptField(
    field: string,
    oldValue: string | null,
    conf: Config
): Promise<string | null> {
    if (oldValue == null) {
        oldValue = "";
    }
    return new Promise((resolve) => {
        new FieldPromptModal(ctx.app, field, oldValue, (value) => {
            if (value === null) {
                resolve(null);
            }
            resolve(`${value}`.trim());
        }).open();
    });
}

export class ReactModal extends Modal {
    render(modalComponent: JSX.Element) {
        this.modalEl.className = modalComponent.props.className;
        ReactDOM.render(modalComponent.props.children, this.modalEl);
    }
}

export class ReactCallbackModal<T> extends ReactModal {
    value: T;
    success: boolean = false;
    constructor(
        app: App,
        public oldValue: T,
        public callback: { (newValue: T | null): void }
    ) {
        super(app);
        this.value = oldValue;
    }

    submitCallback = (value: T) => {
        this.success = true;
        this.callback(value);
        this.close();
    };

    setValueCallback = (value: T) => {
        this.value = value;
    };

    onClose() {
        if (!this.success) {
            if (this.value !== this.oldValue) {
                this.callback(this.value);
            } else {
                this.callback(null);
            }
        }
    }
}

export class NamePromptModal extends ReactCallbackModal<string> {
    constructor(
        app: App,
        public prefix: string,
        oldName: string,
        callback: { (name: string | null): void }
    ) {
        super(app, oldName, callback);
    }

    onOpen() {
        this.render(
            <div className="modal typing-modal-name">
                {this.prefix ? (
                    <PrefixComponent
                        className="typing-modal-name-prefix"
                        prefix={this.prefix}
                    />
                ) : (
                    {}
                )}
                <TextArea
                    responsive={true}
                    value={this.value}
                    className="typing-modal-name-input"
                    submitCallback={this.submitCallback}
                    setValueCallback={this.setValueCallback}
                ></TextArea>
            </div>
        );
    }
}

export class FieldPromptModal extends ReactCallbackModal<string> {
    constructor(
        app: App,
        public fieldName: string,
        oldValue: string,
        callback: { (name: string | null): void }
    ) {
        super(app, oldValue, callback);
    }

    onOpen() {
        this.render(
            <div className="modal typing-modal-field">
                <div className="typing-modal-field-name">
                    {this.fieldName}
                    {": "}
                </div>
                <TextArea
                    responsive={true}
                    value={this.value}
                    className="typing-modal-field-input"
                    submitCallback={this.submitCallback}
                    setValueCallback={this.setValueCallback}
                ></TextArea>
            </div>
        );
    }
}

export class ActionsModal extends ReactModal {
    constructor(
        app: App,
        public actions: Array<Action>,
        public pinnedActions: { [name: string]: Action },
        public note: TypedNote
    ) {
        super(app);
    }

    onOpen() {
        let actionCards = [];
        for (let action of this.actions) {
            actionCards.push(
                ActionCard(action, () => {
                    this.close();
                    this.note.runAction(action.name);
                })
            );
        }
        let pinnedActionCards = [];
        for (let actionName in this.pinnedActions) {
            let action = this.pinnedActions[actionName];
            pinnedActionCards.push(
                ActionCard(action, () => {
                    this.close();
                    this.note.runPinnedAction(action.name);
                })
            );
        }
        this.render(
            <div className="modal typing-modal-actions">
                <div className="typing-note-actions">{actionCards}</div>
                <div className="typing-pinned-actions">{pinnedActionCards}</div>
            </div>
        );
    }
}

export class ActionsFuzzySuggestModal extends SuggestModal<Action> {
    constructor(
        app: App,
        public actions: Array<Action>,
        public pinnedActions: { [name: string]: Action },
        public note: TypedNote
    ) {
        super(app);
    }
    async renderSuggestion(action: Action, el: HTMLElement) {
        return ReactDOM.render(
            ActionLine(action, () => {}),
            el
        );
    }

    getSuggestions(query: string): Action[] {
        let preparedQuery = prepareQuery(query);
        let result = [];
        for (let actionName in this.pinnedActions) {
            let action = this.pinnedActions[actionName];
            if (fuzzySearch(preparedQuery, action.name)) {
                result.push(action);
            }
        }
        for (let action of this.actions) {
            if (fuzzySearch(preparedQuery, action.name)) {
                result.push(action);
            }
        }
        return result;
    }

    onChooseSuggestion(action: Action) {
        if (action.pinned) {
            this.note.runPinnedAction(action.name);
        } else {
            this.note.runAction(action.name);
        }
    }
}

export class TypeSuggestModal extends FuzzySuggestModal<Type> {
    constructor(app: App, public callback: { (type: Type): void }) {
        super(app);
    }
    getItems(): Type[] {
        return registry.typesList;
    }
    getItemText(type: Type) {
        return type.name;
    }
    onChooseItem(type: Type) {
        this.callback(type);
    }
}

export class StringSuggestModal extends FuzzySuggestModal<string> {
    constructor(
        app: App,
        public strings: Array<string>,
        public callback: { (type: string): void }
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
