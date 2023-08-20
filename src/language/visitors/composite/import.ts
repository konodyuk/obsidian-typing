import { Type } from "src/typing";
import { createVisitor, Rules, Symbol } from "../index_base";
import * as Visitors from "../pure";

export const Import = () =>
    createVisitor({
        rules: Rules.ImportStatement,
        children: {
            symbols: createVisitor({
                rules: Rules.ImportedSymbols,
                children: {
                    symbol: Visitors.Identifier({ allowString: true }),
                },
                run(node) {
                    let result: Symbol[] = [];
                    this.traverse((node, child) => {
                        let name = child.run(node);
                        result.push({ name, node, nameNode: node });
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
            let module = this.callContext.interpreter.importSmart(path);
            if (!module) {
                this.error("Invalid module");
                return;
            }
            if (module.error) {
                this.error(`Error importing ${path}:\n${module.error}`);
                return;
            }
            for (let symbol of symbols) {
                if (!(symbol.name in module.env)) {
                    this.error("Unknown symbol", symbol.nameNode);
                }
            }
        },
        run(node) {
            let result: Type[] = [];
            let { symbols, path } = this.runChildren();
            let module = this.callContext.interpreter.importSmart(path);
            for (let symbol of symbols) {
                if (!(symbol.name in module.env)) {
                    // TODO: handle: throw error or continue
                    continue;
                }
                result.push(module.env[symbol.name]);
            }
            return result;
        },
        symbols() {
            return this.runChildren({ keys: ["symbols"] })["symbols"];
        },
    });
