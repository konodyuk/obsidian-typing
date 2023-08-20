import { Visitors } from "src/language";
import { Pickers } from "src/ui";
import { field, stripQuotes } from "src/utilities";
import { FieldType } from "./base";

export class Choice extends FieldType<Choice> {
    name = "Choice";

    @field()
    public options: Array<string> = [];

    @field()
    public fuzzy: boolean = true;

    Display: FieldType["Display"] = ({ value }) => {
        if (value && this.inList) {
            value = stripQuotes(value);
        }
        return <>{value}</>;
    };

    Picker = () => {
        let options = this.options.map((x) => ({ value: x }));
        return <Pickers.Choice options={options} />;
    };

    get default() {
        return this.options[0];
    }

    static ParametersVisitor = () =>
        Visitors.ParametersVisitorFactory({
            args: Visitors.Literal(Visitors.String),
            kwargs: {
                fuzzy: Visitors.Literal(Visitors.Boolean),
            },
            init(args, kwargs) {
                return Choice.new({ options: args });
            },
        });
}
