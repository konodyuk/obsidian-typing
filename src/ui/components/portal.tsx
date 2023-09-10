import { RefObject } from "preact";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

type PortalContextType = {
    node: HTMLElement | null;
    setNode: (node: HTMLElement) => void;
};

const PortalContext = createContext<PortalContextType | null>(null);
export const Portal = {
    Scope: ({ children }: { children: React.ReactNode }) => {
        const [node, setNode] = useState<HTMLElement | null>(null);

        return <PortalContext.Provider value={{ node, setNode }}>{children}</PortalContext.Provider>;
    },
    Receiver: ({ ref }: { ref: RefObject<HTMLDivElement> }) => {
        const { node, setNode } = useContext(PortalContext);
        ref = ref ?? useRef<HTMLElement | null>(null);

        useEffect(() => {
            if (ref.current && !node) {
                setNode(ref.current);
            }
            return () => {
                if (node === ref.current) {
                    setNode(null);
                }
            };
        }, []);

        return <div ref={ref}></div>;
    },
    Sender: React.memo(({ children }: { children: React.ReactNode }) => {
        const portalContext = useContext(PortalContext);

        if (!portalContext?.node) return children;

        return ReactDOM.createPortal(children, node);
    }),
};
