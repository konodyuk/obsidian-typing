import { Visitors } from "src/language/visitors";
import { stripQuotes } from "src/utilities";
import { FieldTypes } from ".";
import { FieldType } from "./base";

export class String extends FieldType<String> {
    name = "String";

    Display: FieldType["Display"] = ({ value }) => {
        if (this.context.field.type instanceof FieldTypes.List) {
            value = stripQuotes(value);
        }
        return <>{value}</>;
    };

    get default() {
        return "";
    }

    static ParametersVisitor = () =>
        Visitors.ParametersVisitorFactory({
            init() {
                return String.new();
            },
        });
}
