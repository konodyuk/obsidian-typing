import { SyntaxNode } from "@lezer/common";
import { Type } from "src/typing";
import { createVisitor, Rules } from "../index_base";
import * as Visitors from "../pure";

interface ImportSymbol {
    symbol: string;
    alias: string;
    node: SyntaxNode;
}

export const Import = () =>
    createVisitor({
        rules: Rules.ImportStatement,
        children: {
            symbols: createVisitor({
                rules: Rules.ImportedSymbols,
                children: {
                    symbol: createVisitor({
                        rules: Rules.ImportedSymbol,
                        children: {
                            symbol: Visitors.Identifier({ allowString: true }),
                            alias: Visitors.Proxy(Rules.ImportAlias, Visitors.Identifier({ allowString: true })),
                        },
                        run(node) {
                            return this.runChildren();
                        },
                    }),
                },
                run(node) {
                    let result: ImportSymbol[] = [];
                    this.traverse((node, child) => {
                        let { symbol, alias } = child.run(node);
                        result.push({ alias: alias ?? symbol, symbol, node });
                    });
                    return result;
                },
            }),
            path: Visitors.String.extend({
                complete(node) {
                    // TODO: complete paths
                    return [];
                },
            }),
        },
        lint(node) {
            let { symbols, path } = this.runChildren();
            let module = this.callContext.interpreter.importSmart(path, this.callContext.path);
            if (!module) {
                this.error("Invalid module");
                return;
            }
            if (module.error) {
                this.error(`Error importing ${path}:\n${module.error}`);
                return;
            }
            for (let symbol of symbols) {
                if (!(symbol.symbol in module.env)) {
                    this.error("Unknown symbol", symbol.node);
                }
            }
        },
        run(node) {
            let result: Type[] = [];
            let { symbols, path } = this.runChildren();
            let module = this.callContext.interpreter.importSmart(path, this.callContext.path);
            for (let symbol of symbols) {
                if (!(symbol.symbol in module.env)) {
                    // TODO: handle: throw error or continue
                    continue;
                }
                let importedType = module.env[symbol.symbol];
                importedType.name = symbol.alias;
                result.push(importedType);
            }
            return result;
        },
        symbols() {
            let symbols = this.runChildren({ keys: ["symbols"] })["symbols"];
            return symbols.map((x) => ({ nameNode: x.node, node: x.node, name: x.alias }));
        },
    });
