import * as Composite from "../composite";
import { createVisitor, Rules } from "../index_base";
import * as Pure from "../pure";

export const Expression = createVisitor({
    rules: Rules.File,
    children: {
        expr: createVisitor({
            rules: Rules.Expression,
            children: {
                literal: Pure.Literal(Pure.Union(Pure.String, Pure.Number, Pure.Boolean)),
                field: Composite.Field(),
                fieldType: Composite.FieldType(),
                assignment: Composite.NamedAttribute(Pure.Literal(Pure.Union(Pure.String, Pure.Number, Pure.Boolean))),
            },
            run(node) {
                let children = this.runChildren();
                for (let key in children) {
                    // return first key
                    return children[key];
                }
            },
        }),
    },
    run(node) {
        return this.runChildren()["expr"];
    },
});
