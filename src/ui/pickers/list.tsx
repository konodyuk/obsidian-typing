import classNames from "classnames";
import { Plus } from "lucide-react";
import { Platform } from "obsidian";
import { createContext, useContext, useRef, useState } from "react";
import styles from "src/styles/prompt.scss";
import { Contexts, Picker } from "../components";
import { PickerContext } from "../components/picker";
import { useControls } from "../hooks";
import { ControlSpec } from "../hooks/controls";

export const ListContext = createContext(false);

const REMOVE_CONST = "<|REMOVE|>";

export function List({ SubPicker }: { SubPicker: any }) {
    let pickerCtx = useContext(PickerContext);
    const refs = useRef();

    let controls = useControls({
        parse: (value) => {
            value = value ?? "";
            let values = value.split(",").map((x) => x.trim());
            if (values.length == 0) return [""];
            let lastNotEmpty = values.length - 1;
            while (values[lastNotEmpty]?.length == 0) lastNotEmpty--;
            if (lastNotEmpty == -1) return [""];
            values = values.slice(0, lastNotEmpty + 1);
            values.push("");

            return values;
        },
        compose: (values) => {
            let valuesList = [];

            for (let i = 0; values[i] != null; i++) {
                // TODO: refactor, very ugly
                if (values[i] != REMOVE_CONST) valuesList.push(values[i]);
            }

            let lastNotEmpty = valuesList.length - 1;
            while (valuesList[lastNotEmpty]?.length == 0) lastNotEmpty--;
            if (lastNotEmpty == -1) values = [""];
            valuesList = valuesList.slice(0, lastNotEmpty + 1);

            if (valuesList.length == 0) return "";
            let result = valuesList.join(", ");
            if (valuesList.length == 1) {
                result += ",";
            }
            return result;
        },
    });

    let controlsList: ControlSpec[] = [];
    for (let i = 0; controls[i] != null; i++) {
        controlsList.push(controls[i]);
    }

    refs.current = controlsList.map(() => useRef());

    return (
        <Picker>
            <ListContext.Provider value={true}>
                <div className={styles.list}>
                    {controlsList?.length > 1
                        ? controlsList.slice(0, controlsList.length - 1).map((x, i) => (
                              <ListPickerElement
                                  ref={refs.current[i]}
                                  index={i}
                                  refs={refs.current}
                                  control={controlsList[i]}
                                  fieldName={pickerCtx.state.fieldName}
                              >
                                  <SubPicker />
                              </ListPickerElement>
                          ))
                        : null}
                    <Picker.Wrapper
                        displayOverride={
                            <div class={styles.listIconContainer} tabIndex={-1}>
                                <Plus size={16} />
                            </div>
                        }
                        key={controlsList.length - 1}
                        displayRef={refs.current[controlsList.length - 1]}
                        value={controlsList[controlsList.length - 1].value}
                        onSetValue={(value) => {}}
                        onSubmitValue={(value) => {
                            controlsList[controlsList.length - 1].submitValue(value);
                            const idx = controlsList.length;
                            let done = false;
                            for (let timeout of [10, 50, 100, 1000]) {
                                setTimeout(() => {
                                    const nextEl = refs.current[idx];
                                    if (done) return;
                                    if (!nextEl.current) return;
                                    nextEl.current.focus();
                                    done = true;
                                }, timeout);
                            }
                        }}
                        fieldName={pickerCtx.state.fieldName}
                    >
                        <ListElementWrapper>
                            <SubPicker />
                        </ListElementWrapper>
                    </Picker.Wrapper>
                </div>
            </ListContext.Provider>
        </Picker>
    );
}

const ListElementWrapper = ({ children }) => {
    const pickerCtx = useContext(Contexts.PickerContext);
    return (
        <div class={classNames(styles.listElement, { [styles.listElementActive]: pickerCtx?.state?.isActive })}>
            {children}
        </div>
    );
};

function ListPickerElement({ index, ref, refs, children, control, fieldName }) {
    const [isActive, setIsActive] = useState(false);
    const promptCtx = useContext(Contexts.PromptContext);

    const el = () => refs[index].current.base;

    return (
        <button
            ref={ref}
            key={index}
            onFocus={(e) => {
                e.stopPropagation();
                e.preventDefault();
            }}
            tabIndex={-1}
            onClick={(e) => {
                if (!Platform.isMobile) {
                    if (!isActive) {
                        el().focus();
                    }
                } else {
                    setIsActive(true);
                }
            }}
            onBlur={(e) => {
                if (Platform.isMobile) return;
                for (let container of [el(), promptCtx.state?.dropdownRef?.current?.base]) {
                    for (let element of [e?.relatedTarget, document.activeElement]) {
                        if (container?.contains?.(element)) {
                            return;
                        }
                    }
                }
                setIsActive(false);
            }}
            onKeyDown={(e) => {
                if (e.key == "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsActive(false);
                    refs[index].current.base.focus();
                }
                if (e.target != el()) return;
                if (e.key == "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsActive(true);
                }
                if (e.key == "Delete") {
                    e.preventDefault();
                    e.stopPropagation();
                    control.setValue(REMOVE_CONST);
                }
                if (e.key == "Backspace") {
                    e.preventDefault();
                    e.stopPropagation();
                    control.setValue(REMOVE_CONST);
                    refs[index - 1].current.base.focus();
                }
                if (e.key === "ArrowLeft") {
                    if (index > 0) {
                        refs[index - 1].current.base.focus();
                    } else {
                        refs[refs.length - 2].current.base.focus();
                    }
                }
                if (e.key === "ArrowRight") {
                    if (index < refs.length - 2) {
                        refs[index + 1].current.base.focus();
                    } else {
                        refs[0].current.base.focus();
                    }
                }
            }}
            className={classNames(styles.listElement, { [styles.listElementActive]: isActive })}
        >
            <Picker.Wrapper
                tabIndex={-1}
                isActive={isActive}
                onSetIsActive={setIsActive}
                value={control.value}
                onSetValue={control.setValue}
                fieldName={fieldName}
            >
                {children}
            </Picker.Wrapper>
        </button>
    );
}
