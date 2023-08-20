import { gctx } from "src/context";
import { Visitors } from "src/language";
import { Pickers } from "src/ui";
import { field, stripQuotes } from "src/utilities";
import { FieldTypes } from ".";
import { FieldType } from "./base";

export class Tag extends FieldType<Tag> {
    name = "Tag";

    static requiresDataview = true;

    @field()
    public options: Array<string> = [];

    @field()
    public dynamic: boolean = false;

    @field()
    public fuzzy: boolean = true;

    Display: FieldType["Display"] = ({ value }) => {
        if (this.context.field.type instanceof FieldTypes.List) {
            value = stripQuotes(value);
        }
        return <>{value}</>;
    };

    Picker = () => {
        let options = this.options;
        if (this.dynamic) {
            let dynamicOptions = Array.from(
                gctx.dv.pages(`"${this.context.type.folder}"`).map((p) => p[this.context.field.name])
            );
            options = [].concat(...options, ...dynamicOptions); // flatten
            options = options.filter((x) => typeof x == "string");
            options = Array.from(new Set(options));
        }
        return <Pickers.Choice options={options.map((value) => ({ value }))} dynamic={this.dynamic} />;
    };

    get default() {
        return this.options[0];
    }

    static ParametersVisitor = () =>
        Visitors.ParametersVisitorFactory({
            args: Visitors.Literal(Visitors.String),
            kwargs: {
                dynamic: Visitors.Literal(Visitors.Boolean),
                fuzzy: Visitors.Literal(Visitors.Boolean),
            },
            init(args, kwargs) {
                return Tag.new({ options: args, ...kwargs });
            },
        });
}
