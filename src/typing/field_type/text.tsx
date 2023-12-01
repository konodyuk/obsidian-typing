import { Visitors } from "src/language/visitors";
import { Pickers } from "src/ui";
import { stripQuotes } from "src/utilities";
import { FieldTypes } from ".";
import { FieldType } from "./base";

export class Text extends FieldType<Text> {
    name = "Text";

    Display: FieldType["Display"] = ({ value }) => {
        if (this.context.field.type instanceof FieldTypes.List) {
            value = stripQuotes(value);
        }
        return <>{value}</>;
    };

    Picker: React.FunctionComponent = () => {
        return <Pickers.Text />;
    };

    get default() {
        return "";
    }

    static ParametersVisitor = () =>
        Visitors.ParametersVisitorFactory({
            init() {
                return Text.new();
            },
        });
}
