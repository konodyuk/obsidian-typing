import { Visitors } from "src/language";
import { Pickers } from "src/ui";
import { field } from "src/utilities";
import { FieldType, FieldTypeBindingContext } from "./base";

export class List extends FieldType<List> {
    name = "List";

    @field()
    public type: FieldType = null;

    @field()
    public unique: boolean = false;

    Display: FieldType["Display"] = ({ value }) => {
        return <>{value}</>;
    };

    Picker = () => {
        return <Pickers.List SubPicker={this.type.Picker} />;
    };

    get default() {
        return "";
    }

    bind(context: FieldTypeBindingContext): List {
        let result = super.bind(context);
        // TODO: there may be some troubles with field name, as it will be the same as of outer type
        // result.type = result.type.bind({ type: context.type });
        result.type = result.type.bind(context);
        return result;
    }

    static ParametersVisitor() {
        return Visitors.ParametersVisitorFactory({
            args: Visitors.FieldType(),
            kwargs: {
                unique: Visitors.Literal(Visitors.Boolean),
            },
            init(args, kwargs) {
                return List.new({ type: args[0], ...kwargs });
            },
        });
    }

    get isRelation() {
        return this.type.isRelation;
    }
}
