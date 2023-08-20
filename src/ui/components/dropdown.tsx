import { ComponentChildren } from "preact";
import { createContext, RefObject, useContext, useEffect, useRef, useState } from "react";
import styles from "src/styles/prompt.scss";
import { Contexts } from ".";
import { Portal } from "../components/portal";

type ChildrenProps = { children?: ComponentChildren };

export interface DropdownContextType {
    isActive: boolean;
    setIsActive: (value: boolean) => void;
    panelRef: RefObject<HTMLDivElement>;
    isControlled: boolean;
}

export const DropdownContext = createContext<DropdownContextType | null>(null);

const Dropdown = ({
    children,
    active = undefined,
    ref,
}: ChildrenProps & { active?: boolean; ref?: RefObject<HTMLDivElement> }) => {
    let [isActive, setIsActive] = useState(active ?? false);
    let panelRef = useRef();

    useEffect(() => {
        if (active !== undefined) {
            setIsActive(active);
        }
    }, [active]);

    return (
        <DropdownContext.Provider value={{ isActive, setIsActive, panelRef, isControlled: active !== undefined }}>
            <div ref={ref} class={styles.pickerDropdown}>
                {children}
            </div>
        </DropdownContext.Provider>
    );
};

Dropdown.Panel = (props: ChildrenProps & { static?: boolean }) => {
    const dropdownCtx = useContext(DropdownContext);
    const pickerCtx = useContext(Contexts.PickerContext);
    if (!(pickerCtx?.state.isMobile && props.static) && (!dropdownCtx || !dropdownCtx.isActive)) return null;

    let el = (
        <div
            class={pickerCtx?.state.isMobile ? "" : styles.pickerDropdownPanel}
            ref={dropdownCtx.panelRef}
            onBlur={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTimeout(() => {
                    if (dropdownCtx.isControlled) {
                        return;
                    }
                    if (dropdownCtx.panelRef?.current?.contains?.(document.activeElement)) {
                        return;
                    }
                    if (dropdownCtx.panelRef?.current?.contains?.(e?.relatedTarget)) {
                        return;
                    }
                    dropdownCtx.setIsActive(false);
                }, 100);
            }}
            onKeyDown={(e) => {
                // e.preventDefault();
                // e.stopPropagation();
            }}
        >
            {props.children}
        </div>
    );

    if (pickerCtx?.state.isMobile) {
        return <Portal.Sender>{el}</Portal.Sender>;
    }

    return el;
};

export { Dropdown };
