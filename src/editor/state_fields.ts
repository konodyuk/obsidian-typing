import { StateEffect, StateField } from "@codemirror/state";

interface EditorMetadata {
    path: string;
}

export const setCodeEditorMetadataEffect = StateEffect.define<EditorMetadata>();

export const codeEditorMetadataField = StateField.define<EditorMetadata>({
    create: () => {
        return null;
    },
    update(value, tr) {
        for (let effect of tr.effects) {
            if (effect.is(setCodeEditorMetadataEffect)) {
                return effect.value;
            }
        }
        return value;
    },
});
