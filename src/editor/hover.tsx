import { syntaxTree } from "@codemirror/language";
import { hoverTooltip } from "@codemirror/view";
import { gctx } from "src/context";
import { Visitors } from "src/language/visitors";

export const hover = hoverTooltip((view, pos) => {
    let topNode = syntaxTree(view.state).topNode;

    return Visitors.File.hover(topNode, pos, { state: view.state, interpreter: gctx.interpreter });
});
