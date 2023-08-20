import { Modal, Scope } from "obsidian";
import { createContext, ReactNode } from "react";
import { gctx } from "src/context";
import { render } from "src/utilities";

type PromiseCallbacks<T = any> = {
    resolve: (value?: T) => void;
    reject: (error?: any) => void;
    setOnClose: (handler: () => void) => void;
    onBeforeClose: () => void;
    close: () => void;
};

export const ModalContext = createContext<PromiseCallbacks | null>(null);

export class ReactModal<T = any> extends Modal {
    public promise: Promise<T>;
    private promiseCallbacks: PromiseCallbacks<T>;
    private onCloseHandler: (() => void) | null = null;

    constructor(
        private component: ReactNode,
        public onBeforeClose?: () => boolean | Promise<boolean>,
        private className?: string
    ) {
        super(gctx.app);
        this.scope = new Scope(this.scope);
        this.scope.register([], "Escape", (evt, ctx) => {
            if (!document.activeElement || document.activeElement == document.body) {
                this.close();
            }
        });
        this.promise = new Promise<T>((resolve, reject) => {
            this.promiseCallbacks = {
                close: () => {
                    super.close();
                },
                resolve: (v) => {
                    resolve(v);
                    super.close();
                },
                reject: (e) => {
                    reject(e);
                    super.close();
                },
                setOnClose: (handler) => {
                    this.onCloseHandler = handler;
                },
                onBeforeClose: () => {
                    this.close();
                },
            };
        });
    }

    onOpen(): void {
        if (this.className) this.modalEl.className = this.className;
        this.containerEl.onkeydown = (e) => {
            if (e.key == "Escape") {
                e.preventDefault();
                e.stopPropagation();
                this.close();
            }
        };
        render(
            <ModalContext.Provider value={this.promiseCallbacks}>{this.component}</ModalContext.Provider>,
            this.modalEl
        );
    }

    close = () => {
        (async () => {
            if (!this.onBeforeClose || (await this.onBeforeClose())) {
                this.onCloseHandler?.();
                this.promiseCallbacks.resolve(null);
            }
        })();
    };
}

export function modal<T = any>(
    component: ReactNode,
    className?: string,
    onBeforeClose?: () => boolean | Promise<boolean>
): Promise<T> {
    const reactModal = new ReactModal<T>(component, onBeforeClose, className);
    reactModal.open();
    return reactModal.promise;
}
