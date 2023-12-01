import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState, StateField } from "@codemirror/state";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "codemirror";
import { useContext } from "react";
import { obsidianMarkdownTheme } from "src/editor/themes/obsidian";
import { Contexts, Picker } from "../components";
import { useControls } from "../hooks";

import styles from "src/styles/prompt.scss";

const noNewLineField = StateField.define({
    create() {
        return null;
    },
    update(value, transaction) {
        return value;
    },
    provide: (f) =>
        EditorState.transactionFilter.of((tr) => {
            if (tr.docChanged) {
                let cancel = false;
                tr.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
                    // Detecting new line insertion
                    if (fromA === toA && inserted.length === 1 && inserted.line(1).length === 0) {
                        cancel = true;
                    }
                });
                if (cancel) {
                    return []; // Cancel the transaction if a new line insertion is detected
                }
            }
            return tr;
        }),
});

export function Text() {
    let inList = useContext(Contexts.ListContext);
    let pickerCtx = useContext(Contexts.PickerContext);
    let controls = useControls({
        parse: (text) => {
            if (inList) {
                if (text.startsWith(`"`)) text = text.slice(1);
                if (text.endsWith(`"`)) text = text.slice(0, text.length - 1);
            }
            return { text };
        },
        compose: ({ text }) => {
            if (inList) {
                return `"${text}"`;
            }
            return text;
        },
    });
    return (
        <Picker>
            <Picker.Display>{controls.text.value}</Picker.Display>
            <Picker.Body>
                <CodeMirror
                    onBlur={() => pickerCtx.dispatch({ type: "SET_IS_ACTIVE", payload: false })}
                    onChange={controls.text.setValue}
                    basicSetup={{ lineNumbers: false, foldGutter: false }}
                    value={controls.text.value}
                    placeholder={"Text value..."}
                    className={styles.promptText}
                    theme={obsidianMarkdownTheme}
                    indentWithTab={false}
                    extensions={[markdown({ base: markdownLanguage }), EditorView.lineWrapping, noNewLineField]}
                />
                <Picker.SubmitButton controls={controls} />
            </Picker.Body>
        </Picker>
    );
}
