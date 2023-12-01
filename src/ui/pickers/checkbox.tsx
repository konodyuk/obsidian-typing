import { useContext } from "react";
import { Contexts, Picker } from "../components";
import { useControls } from "../hooks";

import styles from "src/styles/prompt.scss";

export function Checkbox() {
    const pickerCtx = useContext(Contexts.PickerContext);
    let inList = useContext(Contexts.ListContext);
    let controls = useControls({
        parse: (text) => {
            return { flag: text == "true" };
        },
        compose: ({ flag }) => {
            return flag ? "true" : "false";
        },
    });

    let checkbox = (
        <input
            type="checkbox"
            checked={controls.flag.value}
            onClick={(e) => {
                if (e.metaKey) {
                    controls.flag.submitValue(!controls.flag.value);
                } else {
                    controls.flag.setValue(!controls.flag.value);
                }
            }}
            onBlur={(e) => {
                // TODO: reimplement with `useClickAway` from usehooks, as other focus-related stuff
                pickerCtx.dispatch({ type: "SET_IS_ACTIVE", payload: false });
            }}
            onKeyDown={(e) => {
                if (e.key == "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.metaKey) {
                        controls.flag.submitValue(!controls.flag.value);
                    } else {
                        controls.flag.setValue(!controls.flag.value);
                    }
                }
            }}
        />
    );
    if (inList)
        return (
            <Picker>
                <Picker.Display>{checkbox}</Picker.Display>
                <Picker.Body>{checkbox}</Picker.Body>
            </Picker>
        );
    else return <div class={styles.checkboxContainer}>{checkbox}</div>;
}
