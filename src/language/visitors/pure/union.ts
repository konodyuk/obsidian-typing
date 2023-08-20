import { createVisitor, Visitor } from "../index_base";

export const Union = <
    Vs extends Visitor<any, any, any, any, any>[],
    R = Vs extends Visitor<infer RR, any, any, any, any>[] ? RR : never
>(
    ...valueTypes: Vs
) => {
    let acceptedTypes: Record<string, Vs[number]> = {};
    for (let key in valueTypes) {
        let type = valueTypes[key];
        acceptedTypes[`${key}`] = type;
    }

    return createVisitor({
        accept(node) {
            for (let childKey in this.children) {
                if (this.children[childKey].accept(node)) return true;
            }
            return false;
        },
        children: acceptedTypes,
        run(node): R {
            let values = this.runChildren();
            for (let key in values) {
                // return first accepted value
                return values[key as keyof typeof this.children];
            }
        },
        snippets() {
            let result = [];
            for (let key in this.children) {
                result.push(...this.children[key].snippets());
            }
            return result;
        },
        complete(node, context) {
            for (let childKey in this.children) {
                if (this.children[childKey].accept(node)) return this.children[childKey].complete(node, context);
            }
            return null;
        },
        options: {
            traversal: { visitTop: true, visitChildren: false },
        },
    });
};
