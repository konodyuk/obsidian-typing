import { Component, EventRef } from "obsidian";
import React, { createContext, useContext } from "react";
import { Note } from "src/typing";

export interface MarginalContextType {
    container: HTMLElement;
    component: Component;
    note: Note;
    render(el: React.ReactNode): React.Component<{}, {}> | null | undefined;
    print(...args: any[]): void;
    reload(): void;
    on(event: string, handler: (...data: unknown[]) => unknown): EventRef,
    offref(ref: EventRef): void,
    register(cb: () => void): void,
    registerEvent(ref: EventRef): void,
    disableAutoreload(): void,
}

export const MarginalContext = createContext<MarginalContextType | null>(null);

export const useMarginalContext = () => {
    return useContext(MarginalContext);
};
