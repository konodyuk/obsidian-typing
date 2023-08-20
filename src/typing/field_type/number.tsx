import { Visitors } from "src/language";
import { Pickers } from "src/ui";
import { field } from "src/utilities";
import { FieldType } from "./base";

export class Number extends FieldType<Number> {
    name = "Number";

    @field()
    public min: number = 0;

    @field()
    public max: number = 10;

    @field()
    public picker: "dropdown" | "slider" | "rating" = "dropdown";

    Display: FieldType["Display"] = ({ value }) => {
        return <>{value}</>;
    };

    Picker = () => {
        let options = [];
        for (let i = this.min; i <= this.max; i++) {
            options.push({ value: `${i}` });
        }
        return <Pickers.Choice options={options} />;
    };

    get default() {
        return `${this.min}`;
    }

    static ParametersVisitor = () =>
        Visitors.ParametersVisitorFactory({
            kwargs: {
                min: Visitors.Literal(Visitors.Number),
                max: Visitors.Literal(Visitors.Number),
                picker: Visitors.Literal(Visitors.LiteralString(["dropdown", "slider", "rating"])),
            },
            init(args, kwargs) {
                return Number.new(kwargs);
            },
        });
}
