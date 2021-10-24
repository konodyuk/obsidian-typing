import { App, Modal, TextComponent } from "obsidian";
import { Config } from "./config";

export async function promptName(
    prefix: string | null,
    oldName: string | null,
    conf: Config
): Promise<string | null> {
    return new Promise((resolve) => {
        new NameModal(conf.plugin.app, prefix ?? "", oldName ?? "", (name) => {
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
    return new Promise((resolve) => {
        new NameModal(conf.plugin.app, field, oldValue, (value) => {
            if (value === null) {
                resolve(null);
            }
            resolve(`${value}`.trim());
        }).open();
    });
}

export class NameModal extends Modal {
    value: string;
    success: boolean = false;
    constructor(
        app: App,
        public prefix: string,
        public oldText: string,
        public callback: { (name: string | null): void }
    ) {
        super(app);
        this.value = oldText;
    }

    onOpen() {
        while (this.modalEl.firstChild) {
            this.modalEl.removeChild(this.modalEl.firstChild);
        }
        this.modalEl.classList.add("typing-prompt-name");
        if (this.prefix) {
            let prefEl = this.modalEl.createDiv({
                cls: "typing-prompt-name-prefix",
            });
            prefEl.innerText = this.prefix;
        }
        let nameEl = new TextComponent(this.modalEl);
        nameEl.setValue(this.oldText);
        nameEl.onChange((value) => {
            this.value = value;
        });
        nameEl.inputEl.addEventListener("keydown", (evt: KeyboardEvent) => {
            if (evt.key === "Enter") {
                this.success = true;
                this.callback(this.value);
                this.close();
            }
        });
        nameEl.inputEl.classList.add("typing-prompt-name-input");
        nameEl.inputEl.focus();
    }

    onClose() {
        if (!this.success) {
            if (this.value) {
                this.callback(this.value);
            } else {
                this.callback(null);
            }
        }
    }
}
