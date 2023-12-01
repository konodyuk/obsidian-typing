import { Visitors } from "src/language";
import { Pickers } from "src/ui";
import { field } from "src/utilities";
import { FieldType } from "./base";

export class Boolean extends FieldType<Boolean> {
    name = "Boolean";

    @field()
    public picker: "checkbox" | "toggle" = "checkbox";

    Display: FieldType["Display"] = ({ value }) => {
        return <>{value}</>;
    };

    Picker = () => {
        if (this.picker == "checkbox") return <Pickers.Checkbox />;
        // if (this.picker == "toggle") return <Pickers.Toggle />;
    };

    get default() {
        return `false`;
    }

    static ParametersVisitor = () =>
        Visitors.ParametersVisitorFactory({
            kwargs: {
                picker: Visitors.Literal(Visitors.LiteralString(["checkbox"])), // TODO: add toggle when implemented
            },
            init(args, kwargs) {
                return Boolean.new(kwargs);
            },
        });
}
