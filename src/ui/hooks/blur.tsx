import { useCallback, useContext } from "react";
import { Contexts } from "..";

export function useBlurCallbacks() {
    const promptCtx = useContext(Contexts.PromptContext);
    const pickerCtx = useContext(Contexts.PickerContext);
    const dropdownCtx = useContext(Contexts.DropdownContext);

    const onPickerBlur = useCallback(
        (e) => {
            if (pickerCtx.state.isMobile) return;
            let containers = [pickerCtx?.state?.bodyRef?.current, promptCtx?.state?.dropdownRef?.current?.base];
            if (e.relatedTarget) {
                let element = e.relatedTarget;
                for (let container of containers) {
                    if (container?.contains?.(element)) {
                        return;
                    }
                }
                if (!promptCtx?.state?.scrollerRef?.current?.contains?.(element)) {
                    return;
                }
                if (!pickerCtx.state.isActiveControlled) {
                    pickerCtx.dispatch({ type: "SET_IS_ACTIVE", payload: false });
                }
                pickerCtx?.dispatch({ type: "SET_IS_SELECTED", payload: false });
            } else {
                setTimeout(() => {
                    let element = document.activeElement;
                    for (let container of containers) {
                        if (container?.contains?.(element)) {
                            return;
                        }
                    }
                    if (!promptCtx?.state?.scrollerRef?.current?.contains?.(element)) {
                        return;
                    }
                    if (!pickerCtx.state.isActiveControlled) {
                        pickerCtx.dispatch({ type: "SET_IS_ACTIVE", payload: false });
                    }
                    pickerCtx?.dispatch({ type: "SET_IS_SELECTED", payload: false });
                });
            }
        },
        [promptCtx, pickerCtx]
    );

    const onDropdownBlur = useCallback(
        (e) => {
            if (pickerCtx?.state?.isMobile) return;
            if (!dropdownCtx) return;

            if (dropdownCtx.panel?.contains?.(document.activeElement)) {
                return;
            }
            if (dropdownCtx.panelRef?.current?.contains?.(document.activeElement)) {
                return;
            }
            if (dropdownCtx.panelRef?.current?.contains(e?.relatedTarget)) {
                return;
            }
            if (dropdownCtx.targetRef?.current?.contains?.(document.activeElement)) {
                return;
            }
            if (dropdownCtx.targetRef?.current?.contains?.(e.relatedTarget)) {
                return;
            }
            if (!dropdownCtx.isControlled) {
                dropdownCtx.setIsActive(false);
                dropdownCtx?.targetRef?.current?.querySelector("input")?.focus();
            }
        },
        [dropdownCtx]
    );

    return { onPickerBlur, onDropdownBlur };
}
