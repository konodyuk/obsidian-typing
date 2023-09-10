import { ComponentChildren } from "preact";
import { createContext, RefObject, useContext, useEffect, useRef, useState } from "react";
import { usePopper } from "react-popper";
import styles from "src/styles/prompt.scss";
import { Contexts } from ".";
import { Portal } from "../components/portal";
import { useBlurCallbacks } from "../hooks";

type ChildrenProps = { children?: ComponentChildren };

export interface DropdownContextType {
    isActive: boolean;
    setIsActive: (value: boolean) => void;
    panelRef: RefObject<HTMLDivElement>;
    targetRef: RefObject<HTMLDivElement>;
    panel: HTMLDivElement;
    target: HTMLDivElement;
    setPanel: any;
    setTarget: any;
    isControlled: boolean;
}

export const DropdownContext = createContext<DropdownContextType | null>(null);

const Dropdown = ({
    children,
    active = undefined,
    targetRef,
    panelRef,
}: ChildrenProps & {
    active?: boolean;
    targetRef?: RefObject<HTMLDivElement>;
    panelRef?: RefObject<HTMLDivElement>;
}) => {
    let [isActive, setIsActive] = useState(active ?? false);
    let [panel, setPanel] = useState();
    let [target, setTarget] = useState();
    panelRef = panelRef ?? useRef();
    targetRef = targetRef ?? useRef();

    useEffect(() => {
        if (active !== undefined) {
            setIsActive(active);
        }
    }, [active]);

    return (
        <DropdownContext.Provider
            value={{
                isActive,
                setIsActive,
                panelRef,
                targetRef,
                panel,
                setPanel,
                target,
                setTarget,
                isControlled: active !== undefined,
            }}
        >
            <div
                ref={(node) => {
                    targetRef.current = node;
                    setTarget(node);
                }}
                class={styles.pickerDropdown}
            >
                {children}
            </div>
        </DropdownContext.Provider>
    );
};

Dropdown.Panel = (props: ChildrenProps & { static?: boolean }) => {
    const dropdownCtx = useContext(DropdownContext);
    const pickerCtx = useContext(Contexts.PickerContext);
    const { onDropdownBlur, onPickerBlur } = useBlurCallbacks();
    const isMobile = pickerCtx?.state.isMobile;
    if (!(isMobile && props.static) && (!dropdownCtx || !dropdownCtx.isActive)) return null;

    let el;
    if (!isMobile) {
        const { styles: position, attributes } = usePopper(dropdownCtx.target, dropdownCtx.panel, {
            placement: "bottom-start",
            // modifiers: [
            //     {
            //         name: "flip",
            //         enabled: false,
            //     },
            // ],
        });
        el = (
            <div
                class={styles.pickerDropdownPanel}
                ref={(node) => {
                    dropdownCtx.panelRef.current = node;
                    dropdownCtx.setPanel(node);
                }}
                style={position.popper}
                onBlur={(e) => {
                    dropdownCtx.target.focus();
                    onPickerBlur(e);
                    setTimeout(() => {
                        onDropdownBlur(e);
                    }, 100);
                }}
            >
                {props.children}
            </div>
        );
    } else {
        el = <div>{props.children}</div>;
    }

    return <Portal.Sender>{el}</Portal.Sender>;
};

export { Dropdown };
