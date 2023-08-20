import { NodeType, Rules, Symbol, TVisitorArgsBase } from ".";

export const ScopeWrapper = ({ shouldComplete = true }: { shouldComplete: boolean }) => {
    return {
        tags: ["scope"],
        symbols() {
            let symbols = [] as Symbol[];
            this.traverse((node, child) => {
                for (let symbol of child.symbols(node)) {
                    symbols.push(symbol);
                }
            });
            return symbols;
        },
        lint(node) {
            let unexpectedNodes: NodeType[] = [];
            this.traverse(() => {}, {
                callbackNotAccepted(node) {
                    if (node.name == Rules.LineComment) return;
                    unexpectedNodes.push(node);
                },
            });
            for (let node of unexpectedNodes) {
                this.error("Unexpected statement.", node);
            }

            let set = new Set();
            for (let symbol of this.symbols(node)) {
                if (set.has(symbol.name)) {
                    this.error(`Duplicate symbol: ${symbol.name}`, symbol.nameNode);
                }
                set.add(symbol.name);
            }
            // TODO
            // this.super?.lint(node);
        },
        complete(node) {
            if (!shouldComplete) return [];
            let result = [];
            for (let key in this.children) {
                result.push(...this.children[key].snippets());
            }
            let symbols = this.symbols(node).map((x) => x.name);
            result = result.filter((x) => !x.symbol || !symbols.contains(x.symbol));
            for (let i = 0; i < result.length; i++) {
                result[i].boost = -i;
            }
            return result;
        },
    } as TVisitorArgsBase;
};
