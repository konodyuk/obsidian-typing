import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { gctx } from "src/context";
import { Visitors } from "src/language/visitors";

export const decorationsPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.create(view);
        }

        update(update: ViewUpdate) {
            if (update.docChanged) {
                this.create(update.view);
            }
        }

        create(view: EditorView) {
            let topNode = syntaxTree(view.state).topNode;
            let decs = Visitors.File.decorations(topNode, view, { state: view.state, interpreter: gctx.interpreter });
            let builder = new RangeSetBuilder<Decoration>();
            for (let dec of decs) {
                builder.add(dec.from, dec.to, dec.value);
            }
            this.decorations = builder.finish();
        }
    },
    {
        decorations: (v) => v.decorations,
    }
);
