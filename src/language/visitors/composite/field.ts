import { gctx } from "src/context";
import { Field as FieldObject, FieldType as FieldTypeObject, FieldTypes } from "src/typing";
import * as Visitors from ".";
import { createVisitor, Rules, TVisitorBase } from "../index_base";

type RetType<V extends TVisitorBase> = V extends TVisitorBase<infer R> ? R : never;
type RetTypeMap<M extends Record<string, TVisitorBase>> = { [K in keyof M]: RetType<M[K]> };

const createKwargChildren = (kwargs: Record<string, TVisitorBase>) => {
    const kwargChildren: Record<string, TVisitorBase<any>> = {};

    for (let key in kwargs) {
        kwargChildren[key] = createVisitor({
            rules: Rules.Parameter,
            children: {
                value: Visitors.Proxy(Rules.ParameterValue, kwargs[key]),
            },
            accept(node) {
                const nameNode = node.getChild(Rules.ParameterName);
                return nameNode && this.getNodeText(nameNode) === key;
            },
            run(node) {
                return this.runChildren()["value"];
            },
            symbols(node) {
                return [{ name: key, node: node, nameNode: node.getChild(Rules.ParameterName) }];
            },
        });
    }

    return kwargChildren;
};

export const ParametersVisitorFactory = <Arg extends TVisitorBase, Kwargs extends Record<string, TVisitorBase>, Ret>({
    args = null,
    kwargs = null,
    init,
}: {
    args?: Arg;
    kwargs?: Kwargs;
    init: (args: RetType<Arg>[], kwargs: RetTypeMap<Kwargs>) => Ret;
}) => {
    const argChildren: Partial<{ literal: TVisitorBase<any> }> = args
        ? { literal: Visitors.Proxy(Rules.ParameterValue, args) }
        : {};
    const kwargChildren = kwargs ? createKwargChildren(kwargs) : {};

    return createVisitor({
        rules: Rules.ParameterList,
        children: {
            __arg: createVisitor({
                rules: Rules.Parameter,
                children: argChildren,
                accept(node) {
                    return !node.getChild(Rules.ParameterName);
                },
                run(node) {
                    return this.runChildren()["literal"];
                },
            }),
            ...kwargChildren,
        },
        run(node) {
            const argVisitor = this.children.__arg;
            const args: RetType<Arg>[] = [];

            this.traverse((node, child) => {
                if (child == argVisitor) {
                    args.push(child.run(node));
                }
            });

            const kwargsResults = this.runChildren();
            return init(args, kwargsResults as RetTypeMap<Kwargs>);
        },
        lint(node) {
            let metKwarg = false;
            let argVisitor = this.children.__arg;
            let kwargsSet = new Set();
            let argsAfterKwargs: (typeof node)[] = [];
            let notAccepted: (typeof node)[] = [];
            let repeatedKwargs: (typeof node)[] = [];

            this.traverse(
                (node, child) => {
                    if (child == argVisitor && metKwarg) {
                        argsAfterKwargs.push(node);
                    }
                    if (child != argVisitor) {
                        metKwarg = true;
                        for (let symbol of child.symbols(node)) {
                            if (kwargsSet.has(symbol.name)) {
                                repeatedKwargs.push(symbol.node);
                            }
                            kwargsSet.add(symbol.name);
                        }
                    }
                },
                {
                    callbackNotAccepted(node) {
                        notAccepted.push(node);
                    },
                }
            );

            argsAfterKwargs.forEach((node) => this.error("Args should go strictly before kwargs.", node));
            notAccepted.forEach((node) => this.error("Unexpected parameter.", node));
            repeatedKwargs.forEach((node) => this.error("Repeated parameter.", node));
        },
    });
};

export const FieldType = () =>
    createVisitor({
        rules: Rules.AssignmentType,
        children: {
            name: Visitors.Identifier(),
        },
        lint(node) {
            let name = this.runChildren({ keys: ["name"] })["name"];
            if (!(name in FieldTypes)) {
                this.error(`Unknown field type: ${name}. Allowed types: ${Object.keys(FieldTypes)}`);
                return;
            }
            let params = node.getChild(Rules.ParameterList);
            if (!params) return;
            let fieldType = FieldTypes[name as keyof typeof FieldTypes];
            if (fieldType.requiresDataview && !gctx.dv) {
                // TODO: action "Install DataView"
                this.error(`${name} requires DataView.`);
                return;
            }
            let paramsVisitor = fieldType.ParametersVisitor();
            if (!paramsVisitor) {
                this.error(`${name} does not take parameters`, params);
                return;
            }
            let diagnostics = paramsVisitor.lint(params);
            this.joinDiagnostics(diagnostics.diagnostics);
        },
        run(node): FieldTypeObject {
            let name = this.runChildren({ keys: ["name"] })["name"];
            let paramsVisitor = ((FieldTypes as any)[name] as typeof FieldTypeObject).ParametersVisitor();
            let params = node.getChild(Rules.ParameterList);
            if (!params) {
                return (FieldTypes as any)[name].new({});
            }
            return paramsVisitor.run(params);
        },
    });

const Any = () => Visitors.Union(Visitors.String, Visitors.Number, Visitors.Boolean);
const AnyComposite = () => Visitors.Union(Visitors.List(Any()), Any());

export const Field = () =>
    createVisitor({
        rules: Rules.Assignment,
        children: {
            name: Visitors.Proxy(Rules.AssignmentName, Visitors.Identifier({ allowString: true })),
            type: FieldType(),
            default: createVisitor({
                rules: Rules.AssignmentValue,
                run() {
                    return this.runChildren({ keys: ["literal"], eager: true })["literal"];
                },
                children: {
                    literal: Visitors.Literal(AnyComposite()),
                },
            }),
        },
        run(): FieldObject {
            let opts = this.runChildren();
            return FieldObject.new(opts);
        },
        symbols(node) {
            let nameNode = node.getChild(Rules.AssignmentName);
            if (!nameNode) return;
            let name = this.children.name.run(nameNode);
            return [{ name, nameNode, node }];
        },
    });
