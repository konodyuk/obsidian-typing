import { Type as TypeObject } from "src/typing";
import * as Visitors from "../composite";
import { createVisitor, Rules } from "../index_base";
import * as Wrappers from "../wrappers";
import { Type } from "./type";

export const File = createVisitor({
    rules: Rules.File,
    tags: ["file"],
    children: {
        type: Type,
        import: Visitors.Import(),
    },
    run(node) {
        let module: Record<string, TypeObject> = {};
        this.traverse((node, child) => {
            let types = child.run(node);
            for (let type of types) {
                module[type.name] = type;
                if (!type.parentNames) continue;
                // NOTE: the order of inheritance is correct because a type has to be defined below its parents
                for (let parent of type.parentNames) {
                    // TODO: distinguish imported already inherited types from defined here
                    if (!module[parent]) continue;
                    type.inherit(module[parent]);
                }
            }
        });
        return module;
    },
}).extend(Wrappers.ScopeWrapper({ shouldComplete: true }));
