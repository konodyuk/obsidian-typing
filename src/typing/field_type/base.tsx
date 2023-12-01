import { TVisitorBase } from "src/language/visitors";
import { Pickers } from "src/ui";
import { Bindable, DataClass } from "src/utilities";
import { Field } from "../field";
import { Type } from "../type";

export interface FieldTypeBindingContext {
    field: Field;
    type?: Type;
}

export abstract class FieldType<InstanceType extends FieldType = any>
    extends DataClass
    implements Bindable<FieldTypeBindingContext, InstanceType>
{
    context?: FieldTypeBindingContext;

    abstract readonly name: string;
    static requiresDataview: boolean = false;

    Picker: React.FunctionComponent = () => {
        return <Pickers.Text />;
    };

    Display: React.FunctionComponent<{ value: string }> = ({ value }) => {
        return <>{value}</>;
    };

    get default(): string {
        return "";
    }

    bind(context: FieldTypeBindingContext): InstanceType {
        let instance = this.copy();
        instance.context = context;
        return instance;
    }

    static ParametersVisitor: () => TVisitorBase<any>;
    static ValueVisitor: TVisitorBase<any> = null;

    get isRelation(): boolean {
        return false;
    }

    get inList(): boolean {
        // HACK to not depend on FieldTypes.List in base class
        return this !== this.context?.field?.type?.type;
    }
}
