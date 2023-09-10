import classNames from "classnames";
import { Platform } from "obsidian";
import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "src/styles/prompt.scss";
import { Contexts } from ".";
import { useActiveControl, useBlurCallbacks } from "../hooks";
import { ControlSpec } from "../hooks/controls";

export const Input = React.memo(
    (props: {
        control?: ControlSpec;
        value?: string;
        onChange?: (value: string, event: Event) => void;
        onSubmitValue?: (value: string, event: Event) => void;
        onSetValue?: (value: string, event: Event) => void;
        preview?: (value: string) => any;
        onBeforeKeyDown?: (event: Event) => boolean;
        onBeforeFocus?: (event: Event) => boolean;
        onBeforeBlur?: (event: Event) => boolean;
        autofocus?: boolean;
        autofocusMobile?: boolean;
        placeholder?: string;
        style?: any;
        isActive?: boolean;
    }) => {
        const dropdownCtx = useContext(Contexts.DropdownContext);
        const inputRef = useRef();
        const [active, setActive] = useState(false);
        const { onDropdownBlur, onPickerBlur } = useBlurCallbacks();
        const { onBeforeFocus } = useActiveControl();

        const isActive = props.isActive !== undefined ? props.isActive : dropdownCtx?.isActive || active;

        const onFocus = (e) => {
            onBeforeFocus(e);
            if (props.onBeforeFocus?.(e)) return;
            setActive(true);
            dropdownCtx?.setIsActive(true);
        };

        const onBlur = (e: FocusEvent) => {
            if (props.onBeforeBlur?.(e)) return;
            setTimeout(() => {
                if (dropdownCtx != null) {
                    onDropdownBlur(e);
                } else {
                    setActive(false);
                }
                onPickerBlur(e);
            }, 100);
        };

        if ((props.autofocus && !Platform.isMobile) || (props.autofocusMobile && Platform.isMobile)) {
            useEffect(() => {
                inputRef.current.focus();
            }, []);
        }

        const onSetValueHandler = props.onSetValue ?? props.control?.setValue;
        const onSubmitValueHandler = props.onSubmitValue ?? props.control?.submitValue ?? onSetValueHandler;

        return (
            <div class={styles.inputContainer}>
                <input
                    value={props.value ?? props.control?.value}
                    onChange={(e) => props.onChange?.(e.target.value, e)}
                    onKeyDown={(e) => {
                        if (props.onBeforeKeyDown?.(e)) return;
                        if (e.key == "Enter") {
                            if (e.metaKey) {
                                onSubmitValueHandler?.(e.target.value, e);
                            } else {
                                onSetValueHandler?.(e.target.value, e);
                            }
                        }
                    }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    ref={inputRef}
                    type="text"
                    class={classNames({ [styles.input]: true, [styles.inputTransparent]: !isActive })}
                    style={props.style}
                    placeholder={props.placeholder}
                />
                {!isActive && (
                    <span class={styles.inputPreview}>
                        {props.preview
                            ? props.preview(props.value ?? props.control?.value)
                            : props.value ?? props.control?.value}
                    </span>
                )}
            </div>
        );
    }
);
