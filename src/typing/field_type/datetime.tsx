import { Visitors } from "src/language";
import { Pickers } from "src/ui";
import { FieldType } from "./base";

export class DateTime extends FieldType<DateTime> {
    name = "DateTime";

    Display: FieldType["Display"] = ({ value }: { value?: luxon.DateTime | string }) => {
        if (typeof value != "string") return <>{value?.toLocal?.().toFormat?.("yyyy-MM-dd hh:mm") ?? "invalid date/time"}</>;
        return <>{value}</>;
    };

    Picker = () => {
        return <Pickers.DateTime showTime={true} />;
    };

    get default() {
        return ``;
    }

    static ParametersVisitor = () =>
        Visitors.ParametersVisitorFactory({
            init(args, kwargs) {
                return DateTime.new();
            },
        });
}
