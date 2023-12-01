import { Visitors } from "src/language";
import { Pickers } from "src/ui";
import { FieldType } from "./base";

export class Date extends FieldType<Date> {
    name = "Date";

    Display: FieldType["Display"] = ({ value }) => {
        if (typeof value != "string") return <>{value?.toLocal?.().toFormat?.("yyyy-MM-dd") ?? "invalid date"}</>;
        return <>{value}</>;
    };

    Picker = () => {
        return <Pickers.Date />;
    };

    get default() {
        return ``;
    }

    static ParametersVisitor = () =>
        Visitors.ParametersVisitorFactory({
            init(args, kwargs) {
                return Date.new();
            },
        });
}
