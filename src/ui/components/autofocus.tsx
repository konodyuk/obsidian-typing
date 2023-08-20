import { ComponentChildren } from "preact";
import { useEffect, useRef } from "react";

export const AutoFocusGate = ({
    children,
    block = false,
    ...props
}: {
    autoFocus?: boolean;
    children: ComponentChildren;
} & any) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (block && modalRef.current) {
            // This will focus the div itself, taking the focus away from inputs/buttons.
            modalRef.current.focus();
        }
    }, [block]);

    return (
        <div tabIndex={-1} ref={modalRef} {...props}>
            {children}
        </div>
    );
};
