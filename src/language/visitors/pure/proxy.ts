import { createVisitor, Rules, TVisitorBase } from "../index_base";

export const Proxy = <R>(proxyRules: Rules | Rules[], visitor: TVisitorBase<R>) =>
    createVisitor({
        rules: proxyRules,
        children: { visitor },
        accept(node) {
            return visitor.accept(node.firstChild);
        },
        run(node) {
            return visitor.run(node.firstChild);
        },
        lint(node) {
            return visitor.lint(node.firstChild);
        },
        complete(node, context) {
            return visitor.complete(node.firstChild, context);
        },
        snippets() {
            return visitor.snippets();
        },
    });
