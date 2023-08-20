import classNames from "classnames";
import { CornerDownLeft } from "lucide-react";
import { Platform } from "obsidian";
import { ComponentChildren } from "preact";
import React, { createContext, useContext, useEffect, useReducer, useRef } from "react";
import styles from "src/styles/prompt.scss";
import { ControlsResult } from "../hooks/controls";
import { Portal } from "./portal";
import { PromptContext } from "./prompt";

type ChildrenProps = { children?: ComponentChildren };

export interface PickerConfig {
    fieldName: string;
    isMobile?: boolean;
    isActive?: boolean;
    value?: string;
    onSetValue: (value: string) => void;
    onSubmitValue?: (value: string) => void;
    onSetIsActive?: (value: boolean) => void;
    tabIndex?: number;
    displayOverride?: any;
}

export interface PickerState extends PickerConfig {
    isSelected?: boolean;
    bodyRef?: React.RefObject<any>;
    modalRef?: React.RefObject<any>;
    displayRef?: React.RefObject<any>;
    isActiveControlled?: boolean;
}

type PickerActionType =
    | { type: "SET_VALUE"; payload: string }
    | { type: "SUBMIT_VALUE"; payload: string }
    | { type: "HANDLE_FOCUS" }
    | { type: "SET_IS_ACTIVE"; payload: boolean }
    | { type: "SET_IS_SELECTED"; payload: boolean }
    | { type: "EXIT" }
    | { type: "FOCUS_DISPLAY" }
    | { type: "HANDLE_BLUR"; payload: FocusEvent };

function pickerReducer(state: PickerState, action: PickerActionType): PickerState {
    let isActive;
    switch (action.type) {
        case "SET_VALUE":
            state.onSetValue?.(action.payload);
            return { ...state, value: action.payload };
        case "SUBMIT_VALUE":
            (state.onSubmitValue ?? state.onSetValue)?.(action.payload);
            return { ...state, value: action.payload };
        case "HANDLE_FOCUS":
            return pickerReducer(state, { type: "SET_IS_ACTIVE", payload: true });
        case "SET_IS_ACTIVE":
            state.onSetIsActive?.(action.payload);
            return { ...state, isActive: action.payload };
        case "SET_IS_SELECTED":
            isActive = action.payload;
            return { ...state, isSelected: action.payload };
        case "EXIT":
            state.displayRef?.current?.focus();
            return { ...state, isActive: false, isSelected: true };
        case "HANDLE_BLUR":
            const event = action.payload;
            isActive = false;
            if (state.bodyRef?.current?.contains(event.relatedTarget)) {
                isActive = true;
            }
            return pickerReducer(state, { type: "SET_IS_ACTIVE", payload: isActive });
        default:
            return state;
    }
}

export interface PickerContextType {
    state: PickerState;
    dispatch: React.Dispatch<PickerActionType>;
    config: PickerConfig;
}

export const PickerContext = createContext<PickerContextType | null>(null);

export const Picker = ({ children }: ChildrenProps) => {
    return <>{children}</>;
};

Picker.SubmitButton = (props: { controls: ControlsResult<any> }) => {
    let pickerCtx = useContext(PickerContext);
    if (!Platform.isMobile) return null;
    return (
        <button
            onClick={() => {
                props.controls.submitCurrentValue();
                pickerCtx.dispatch({ type: "SET_IS_ACTIVE", payload: false });
            }}
            className={styles.pickerSubmitButton}
        >
            <CornerDownLeft />
        </button>
    );
};

Picker.Display = React.memo(
    ({ children, static: static_ = false, value, ...props }: ChildrenProps & { static?: boolean; value?: string }) => {
        let { state, dispatch } = useContext(PickerContext);
        let promptCtx = useContext(PromptContext);

        const onFocus = (e) => {
            if (state.isMobile) return;
            if (!state.isActiveControlled && !state.isActive && !state.isSelected)
                dispatch({ type: "SET_IS_ACTIVE", payload: true });
            if (!state.isSelected) dispatch({ type: "SET_IS_SELECTED", payload: true });
        };

        const onBlur = (e) => {
            if (state.isMobile) return;
            if (!state.isActiveControlled && !state.isActive && state.isSelected)
                dispatch({ type: "SET_IS_SELECTED", payload: false });
        };

        const onClick = (e) => {
            if (!state.isActiveControlled && !state.isActive) {
                dispatch({ type: "SET_IS_ACTIVE", payload: true });
            }
            if (!state.isSelected) {
                dispatch({ type: "SET_IS_SELECTED", payload: true });
            }
        };

        const onKeyDown = (e) => {
            if (state.isMobile) return;
            if (e.key == "Enter") {
                if (!state.isActiveControlled && !state.isActive) dispatch({ type: "SET_IS_ACTIVE", payload: true });
                if (!state.isSelected) dispatch({ type: "SET_IS_SELECTED", payload: true });
            }
        };

        let field = promptCtx.state.type?.fields?.[state.fieldName];
        let fieldType = field.type?.type ?? field.type;
        let DisplayComponent = fieldType?.Display;

        return (
            <div
                class={classNames(styles.pickerDisplay, {
                    [styles.pickerDisplayHidden]: state.isActive && !static_,
                    [styles.pickerDisplaySelected]: state.isSelected,
                })}
                tabIndex={state.tabIndex ?? state.isActive ? -1 : 0}
                ref={state.displayRef}
                onFocus={onFocus}
                onBlur={onBlur}
                onClick={onClick}
                onKeyDown={onKeyDown}
                {...props}
            >
                {state.displayOverride ?? (children || <DisplayComponent value={value} />)}
            </div>
        );
    }
);

Picker.Body = React.memo(({ children }: ChildrenProps) => {
    let pickerCtx = useContext(PickerContext);
    let { state, dispatch } = pickerCtx;

    if (!state.isActive) return null;

    if (!Platform.isMobile) {
        return (
            <div
                class={styles.pickerContainer}
                ref={state.bodyRef}
                onBlur={(e) => {
                    if (!state.bodyRef?.current?.contains(e?.relatedTarget)) {
                        if (!state.isActiveControlled) dispatch({ type: "SET_IS_ACTIVE", payload: false });
                        dispatch({ type: "SET_IS_SELECTED", payload: false });
                    }
                }}
            >
                {children || "default body"}
            </div>
        );
    } else {
        return (
            <Portal.Sender>
                <Portal.Scope>
                    <div class="modal-container">
                        <div
                            class="modal-bg"
                            onClick={(e) => {
                                dispatch({ type: "SET_IS_ACTIVE", payload: false });
                            }}
                        />
                        <div ref={state.bodyRef} class={classNames(styles.promptPicker, styles.prompt)}>
                            <div class={styles.pickerMobileContainer}>
                                <div
                                    class={styles.pickerContainer}
                                    onBlur={(e) => {
                                        if (!state.bodyRef?.current?.contains(e?.relatedTarget)) {
                                            if (!state.isActiveControlled) {
                                                dispatch({ type: "SET_IS_ACTIVE", payload: false });
                                            }
                                            dispatch({ type: "SET_IS_SELECTED", payload: false });
                                        }
                                    }}
                                >
                                    {children || "default body"}
                                </div>
                            </div>
                            <div class={styles.pickerMobilePanel}>
                                <Portal.Receiver />
                            </div>
                        </div>
                    </div>
                    {/* </div> */}
                </Portal.Scope>
            </Portal.Sender>
        );
    }
});

Picker.Wrapper = ({ children, ...config }: PickerConfig & ChildrenProps) => {
    const pickerState: PickerState = {
        isActive: false,
        isSelected: false,
        bodyRef: useRef(),
        modalRef: useRef(),
        displayRef: useRef(),
        isMobile: Platform.isMobile,
        isActiveControlled: config.isActive !== undefined,
        ...config,
    };
    const [state, dispatch] = useReducer(pickerReducer, pickerState);

    useEffect(() => {
        if (state.value !== config.value) {
            dispatch({ type: "SET_VALUE", payload: config.value });
        }
    }, [config.value]);

    useEffect(() => {
        if (config.isActive !== undefined && state.isActive !== config.isActive) {
            dispatch({ type: "SET_IS_ACTIVE", payload: config.isActive });
        }
    }, [config.isActive]);

    return <PickerContext.Provider value={{ state, dispatch, config }}>{children}</PickerContext.Provider>;
};
