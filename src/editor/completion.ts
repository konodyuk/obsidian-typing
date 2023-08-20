import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import { gctx } from "src/context";
import { Rules } from "src/language/grammar";
import { Visitors } from "src/language/visitors";

// TODO: refactor
export function visitorCompletion(context: CompletionContext): CompletionResult | null {
    let top = syntaxTree(context.state).topNode;
    let inner = top.resolveInner(context.pos, -1);
    let isIdentifier = inner.name == Rules.Identifier;
    let isString = inner.name == Rules.StringIdentifier;
    let word = context.state.wordAt(context.pos);
    let currentText = context.state.sliceDoc(inner.from, inner.to);
    if (!word && !isIdentifier && !isString && !context.explicit) return null;
    let options = Visitors.File.complete(top, context, { state: context.state, interpreter: gctx.interpreter });
    if (options == null) return null;
    options = options.filter((x) => x.label != currentText);
    let from = context.pos;
    let to = null;
    if (word) {
        from = word.from;
        to = word.to;
    }
    if (isIdentifier) {
        from = inner.from;
    }
    if (isString) {
        from = inner.from + 1;
        to = inner.to - 1;
    }
    let result = {
        options,
        from,
        to,
        // from: isWord ? inner.from : context.pos,
        // from: context.pos,
    };
    return result;
}
