import { App, FuzzySuggestModal, Modal } from "obsidian";
import { Fragment, h, render } from "preact";
import ReactDOM from "react-dom";
import { PrefixComponent } from "../components/prefix";
import { TextArea } from "../components/textarea";
import { ctx } from "../context";

export async function promptName(
    prefix: string | null,
    oldName: string | null
): Promise<string | null> {
    if (prefix == null) {
        prefix = "";
    }
    if (oldName == null) {
        oldName = "";
    }
    return new Promise((resolve) => {
        new NameModal(ctx.app, prefix, oldName, (name) => {
            if (name === null) {
                resolve(null);
            }
            resolve(`${prefix} ${name}`.trim());
        }).open();
    });
}

export async function promptTextField(
    fieldName: string,
    oldValue: string | null
): Promise<string | null> {
    if (oldValue == null) {
        oldValue = "";
    }
    return new Promise((resolve) => {
        new TextFieldModal(ctx.app, fieldName, oldValue, (value) => {
            if (value === null) {
                resolve(null);
            }
            resolve(`${value}`.trim());
        }).open();
    });
}

export async function promptChoiceField(
    fieldName: string,
    oldValue: string | null,
    options: Array<string>
): Promise<string | null> {
    console.log("prompting", options);
    if (oldValue == null) {
        oldValue = "";
    }
    return new Promise((resolve) => {
        new ChoiceFieldModal(ctx.app, fieldName, oldValue, options, (value) => {
            console.log("resolving", value);
            if (value == null) {
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

export class NameModal extends ReactCallbackModal<string> {
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

export class TextFieldModal extends ReactCallbackModal<string> {
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

export class ChoiceFieldModal extends FuzzySuggestModal<string> {
    success: boolean = false;
    value: string;

    constructor(
        app: App,
        public fieldName: string,
        public oldValue: string,
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
        this.submitCallback(s);
    }
    onOpen(): void {
        let div = window.createDiv();
        render(
            <div className="typing-modal-field-name">
                {this.fieldName}
                {": "}
            </div>,
            div
        );
        this.modalEl.prepend(div);
        super.onOpen();
    }
    submitCallback = (value: string) => {
        this.success = true;
        this.callback(value);
    };
    onClose() {
        setTimeout(() => {
            if (!this.success) {
                if (this.value !== this.oldValue) {
                    this.callback(this.value);
                } else {
                    this.callback(null);
                }
            }
        }, 100);
    }
}
