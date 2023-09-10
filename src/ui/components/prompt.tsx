import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import CodeMirror from "@uiw/react-codemirror";
import classNames from "classnames";
import { ComponentChildren, RefObject } from "preact";
import React, { createContext, useContext, useEffect, useReducer, useRef } from "react";
import { gctx } from "src/context";
import { obsidianMarkdownTheme } from "src/editor/themes/obsidian";
import styles from "src/styles/prompt.scss";
import { NoteState } from "src/typing";
import { debounce } from "src/utilities";
import { Contexts, modal, Picker, Portal } from ".";

export interface UploadSpec {
    file?: File;
    destination?: string;
    name: string;
}

export type ErrorSpec =
    | {
          type: "title";
          message: string;
      }
    | {
          type: "field";
          fieldName: string;
          message: string;
      };

export interface PromptState extends NoteState {
    uploads?: UploadSpec[];
    errors?: ErrorSpec[];
    dropdownRef?: RefObject<HTMLDivElement>;
    scrollerRef?: RefObject<HTMLDivElement>;
}

const initialState: PromptState = {
    type: undefined,
    fields: {},
    uploads: [],
    errors: [],
};

type PromptActionType =
    | { type: "SET_TITLE"; payload: string }
    | { type: "SET_TEXT"; payload: string }
    | { type: "SET_PREFIX"; payload: string }
    | { type: "SET_FIELD"; payload: { name: string; value: string } }
    | { type: "DEFER_UPLOAD"; payload: UploadSpec }
    | { type: "CANCEL_UPLOAD"; payload: UploadSpec }
    | { type: "SET_STATE"; payload: PromptState };

function promptReducer(state: PromptState, action: PromptActionType): PromptState {
    let newState = state;
    switch (action.type) {
        case "SET_TITLE":
            newState = { ...state, title: action.payload };
            break;
        case "SET_TEXT":
            newState = { ...state, text: action.payload };
            break;
        case "SET_PREFIX":
            newState = { ...state, prefix: action.payload };
            break;
        case "SET_FIELD":
            newState = {
                ...state,
                fields: { ...state.fields, [action.payload.name]: action.payload.value },
            };
            break;
        case "DEFER_UPLOAD":
            newState = { ...state, uploads: [...(state.uploads ?? []), action.payload] };
            break;
        case "CANCEL_UPLOAD":
            newState = {
                ...state,
                uploads: (state.uploads ?? []).filter((value) => value.name != action.payload.name),
            };
            break;
        case "SET_STATE":
            newState = { ...action.payload };
            break;
    }
    return newState;
}

export interface PromptContextType {
    state: PromptState;
    dispatch: React.Dispatch<PromptActionType>;
}

export const PromptContext = createContext<PromptContextType | null>(null);

function PromptRoot({
    children,
    noteState = initialState,
    submitText,
    callback,
    returnOnExit = false,
}: {
    children: ComponentChildren;
    noteState: PromptState;
    submitText?: string;
    callback?: (state: PromptState) => Promise<void>;
    returnOnExit?: boolean;
}) {
    const [state, dispatch] = useReducer(promptReducer, {
        ...noteState,
        dropdownRef: useRef(),
        scrollerRef: useRef(),
    });
    const contextValue: PromptContextType = { state, dispatch };
    const { resolve, setOnClose, onBeforeClose } = useContext(Contexts.ModalContext);

    if (!state.prefix && state.type?.prefix) {
        let prefix = state.type.prefix;
        const setPrefix = () => {
            dispatch({
                type: "SET_PREFIX",
                payload: prefix.apply({ type: state.type, state: state, cdate: new Date() }),
            });
        };
        useEffect(() => {
            setPrefix();
            // TODO: return back when figure out how to stop it from repeating after closing the prompt
            // let handle = setInterval(setPrefix, 2000);
            // return () => clearInterval(handle);
        }, []);
    }

    if (returnOnExit) {
        useEffect(() => {
            setOnClose(() => {
                let errors = validateState(state);
                if (errors) return;
                uploadFiles(state);
                resolve(state);
            });
        }, [setOnClose, resolve, state]);
    }

    if (callback) {
        let asyncUpdateState = debounce(async (latestState) => {
            const newState = { ...latestState };
            await callback(newState);
            if (!statesAreEqual(state, newState)) {
                dispatch({ type: "SET_STATE", payload: newState });
            }
        }, 500);

        useEffect(() => {
            asyncUpdateState(state);
            // Cleanup on component unmount
            return () => asyncUpdateState.cancel();
        }, [state]);
    }

    return (
        <PromptContext.Provider value={contextValue}>
            <Portal.Scope>
                <div class={styles.promptScroller} ref={state.scrollerRef} tabIndex={-1}>
                    {children}
                    <button
                        className={styles.promptSubmitButton}
                        onClick={() => {
                            let errors = validateState(state);
                            if (errors) return;
                            uploadFiles(state);
                            resolve(state);
                        }}
                    >
                        {submitText ?? "Create new note"}
                    </button>
                </div>
                <Portal.Receiver ref={state.dropdownRef} />
            </Portal.Scope>
        </PromptContext.Provider>
    );
}

const Confirmation = ({ text = "The note hasn't been created yet and your progress will be discarded." }) => {
    const { resolve, close } = useContext(Contexts.ModalContext);
    return (
        <>
            <div className="modal-title">Are you sure?</div>
            <div className="modal-content">{text}</div>
            <div className={styles.confirmationButtons}>
                <button
                    className={classNames("mod-cta", styles.confirmationButton)}
                    onClick={() => {
                        resolve(false);
                    }}
                >
                    Cancel
                </button>
                <button
                    className={styles.confirmationButton}
                    onClick={() => {
                        resolve(true);
                    }}
                >
                    Discard & Close
                </button>
            </div>
        </>
    );
};

function PromptTitle({ disabled, prefix = true }: { disabled?: boolean; prefix?: boolean }) {
    const context = useContext(PromptContext);
    if (!context) throw new Error("PromptTitle must be a child of Prompt");
    const { state, dispatch } = context;

    return (
        <div className={styles.promptChild}>
            <div className={styles.promptTitle}>
                {prefix && state.prefix && <span className={styles.promptTitlePrefix}>{state.prefix}</span>}
                <input
                    disabled={disabled}
                    type="text"
                    placeholder="Note title..."
                    className={styles.input}
                    onChange={(e) => dispatch({ type: "SET_TITLE", payload: e.target.value })}
                    value={state.title}
                />
            </div>
        </div>
    );
}

function PromptText() {
    const context = useContext(PromptContext);
    if (!context) throw new Error("PromptText must be a child of Prompt");
    const { state, dispatch } = context;

    return (
        <div class={styles.promptChild}>
            <CodeMirror
                onChange={(value) => dispatch({ type: "SET_TEXT", payload: value })}
                basicSetup={{ lineNumbers: false, foldGutter: false }}
                value={state.text}
                placeholder={"Note content..."}
                className={styles.promptText}
                theme={obsidianMarkdownTheme}
                indentWithTab={false}
                // minHeight={"6em"}
                // maxHeight={"20em"}
                // height="10em"
                extensions={[
                    markdown({ base: markdownLanguage }),
                    // keymap.of([indentWithTab]),
                ]}
            />
        </div>
    );
}

function FieldLabel({ name, label = null }: { name: string; label?: string }) {
    // TODO: use context to check if value is unsaved

    return (
        <div className={styles.promptFieldLabel}>
            {name} {label}
        </div>
    );
}

const PromptField = (props: { name: string; children?: ComponentChildren }) => {
    const { state, dispatch } = useContext(PromptContext);

    const pickerConfig = {
        value: state.fields[props.name],
        onSetValue: (value: string) => {
            dispatch({ type: "SET_FIELD", payload: { name: props.name, value } });
        },
        fieldName: props.name,
    };

    const DefaultPicker = state.type.fields[props.name]?.type.Picker;

    return (
        <div class={styles.promptChild}>
            <FieldLabel name={props.name} />
            <Picker.Wrapper {...pickerConfig}>{props.children ?? <DefaultPicker />}</Picker.Wrapper>
        </div>
    );
};

const PromptFields = ({ names }: { names?: string[] }) => {
    if (!names) {
        let { state } = useContext(PromptContext);
        let fields = state.type?.fields;
        names = [];
        for (let name in fields) {
            names.push(name);
        }
    }
    return (
        <>
            {names.map((name) => (
                <Prompt.Field name={name} />
            ))}
        </>
    );
};

export const Prompt = Object.assign(PromptRoot, {
    Title: PromptTitle,
    Text: PromptText,
    Field: PromptField,
    Fields: PromptFields,
});

function validateState(state: PromptState, validator?: () => ErrorSpec[]): ErrorSpec[] {
    // TODO: check the title is not empty if prefix is empty
    // TODO: check the filename is not taken
    // TODO: check the field values are correct (checks from FieldType)
    // TODO: check the required fields are not empty
    // TODO: run user-defined validations from `<Prompt validate={()=>[errors]} />`
    // return [{ type: "field", fieldName: "id", message: "kek" }];
    return null;
}

async function uploadFiles(state: PromptState) {
    if (!state.uploads?.length) return;

    for (let upload of state.uploads) {
        // TODO: handle repeated names, add counter like `file 1.ext`

        if (!gctx.app.vault.getAbstractFileByPath(upload.destination)) {
            // TODO: check it is folder
            await gctx.app.vault.createFolder(upload.destination);
        }

        // TODO: check it does not exist
        await gctx.app.vault.createBinary(`${upload.destination}/${upload.name}`, await upload.file.arrayBuffer(), {
            mtime: upload.file.lastModified,
        });
    }
}

export async function prompt(ui: JSX.Element, options?: { confirmation?: boolean; confirmationText?: string }) {
    options = options ?? { confirmation: true };
    return await modal(
        ui,
        classNames("modal", styles.prompt),
        options.confirmation
            ? async () =>
                  await modal(
                      <Confirmation text={options.confirmationText} />,
                      classNames("modal", styles.prompt, styles.confirmation)
                  )
            : null
    );
}

function statesAreEqual(state1: PromptState, state2: PromptState): boolean {
    if (state1.type !== state2.type) return false;
    if (state1.prefix !== state2.prefix) return false;
    if (state1.title !== state2.title) return false;
    if (state1.text !== state2.text) return false;

    // Compare fields
    if (state1.fields && state2.fields) {
        if (
            Object.keys(state1.fields).length !== Object.keys(state2.fields).length ||
            !Object.keys(state1.fields).every((key) => state1.fields![key] === state2.fields![key])
        ) {
            return false;
        }
    } else if (state1.fields || state2.fields) {
        return false;
    }

    // Compare uploads
    if (state1.uploads && state2.uploads) {
        if (
            state1.uploads.length !== state2.uploads.length ||
            !state1.uploads.every((upload, idx) =>
                Object.keys(upload).every((key) => upload[key] === state2.uploads![idx][key])
            )
        ) {
            return false;
        }
    } else if (state1.uploads || state2.uploads) {
        return false;
    }

    // Compare errors
    if (state1.errors && state2.errors) {
        if (
            state1.errors.length !== state2.errors.length ||
            !state1.errors.every((error, idx) =>
                Object.keys(error).every((key) => error[key] === state2.errors![idx][key])
            )
        ) {
            return false;
        }
    } else if (state1.errors || state2.errors) {
        return false;
    }

    return true;
}
