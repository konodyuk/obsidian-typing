import { useContext } from "react";
import { Contexts } from "..";

export function useActiveControl() {
    const pickerCtx = useContext(Contexts.PickerContext);

    const onBeforeFocus = (e) => {
        pickerCtx.state.focusedControl.current = e.target;
    };

    return { onBeforeFocus };
}
