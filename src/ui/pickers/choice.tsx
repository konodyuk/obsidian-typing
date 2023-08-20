import { useContext } from "react";
import { Picker } from ".";
import { Combobox, Contexts, IComboboxOption } from "../components";
import { useControls } from "../hooks";

export const Choice = ({
    options,
    dynamic,
    maxOptions = 10,
}: // labelToValue,
{
    options: IComboboxOption[];
    dynamic?: boolean;
    maxOptions?: number;
    // labelToValue?: (label: string) => string;
}) => {
    let inList = useContext(Contexts.ListContext);
    let controls = useControls({
        parse: (text) => {
            if (inList) {
                if (text.startsWith(`"`)) text = text.slice(1);
                if (text.endsWith(`"`)) text = text.slice(0, text.length - 1);
            }
            return { text };
        },
        compose: ({ text }) => {
            if (inList) {
                return `"${text}"`;
            }
            return text;
        },
    });

    return (
        <Picker>
            <Picker.Display>{controls.text.value}</Picker.Display>
            <Picker.Body>
                <Combobox
                    static
                    autofocus
                    options={options}
                    control={controls.text}
                    dynamic={dynamic}
                    maxOptions={maxOptions}
                />
                <Picker.SubmitButton controls={controls} />
            </Picker.Body>
        </Picker>
    );
};
