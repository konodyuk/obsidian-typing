import { useContext } from "react";
import { Contexts, Input, Picker } from "../components";
import { useControls } from "../hooks";

export function String() {
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
                <Input autofocus autofocusMobile control={controls.text} onChange={controls.text.setValue} />
                <Picker.SubmitButton controls={controls} />
            </Picker.Body>
        </Picker>
    );
}
