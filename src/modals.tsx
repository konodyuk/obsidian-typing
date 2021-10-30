import { App, Modal } from "obsidian";
import { Config } from "./config";
import { PrefixComponent } from "./components/prefix";
import React from "react";
import ReactDOM from "react-dom";
import { ctx } from "./context";
import { TextArea } from "./components/textarea";
import { ActionCard, ActionLine } from "./components/action";

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

