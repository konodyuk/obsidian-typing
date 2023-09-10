import { useCallback, useContext, useEffect, useState } from "react";
import { Contexts } from "..";

export interface ControlSpec {
    value: string;
    setValue: (value: string) => Promise<string>;
    submitValue: (value: string) => Promise<string>;
}

export type ControlsResult<T> = {
    [K in keyof T]: ControlSpec;
} & { value: string; submitCurrentValue: () => void };

export function useControls<T extends Record<string | number, any>>({
    parse,
    compose,
}: {
    parse: (value: string) => T;
    compose: (values: T) => string;
    id?: string;
}): ControlsResult<T> {
    const pickerCtx = useContext(Contexts.PickerContext);
    const value = pickerCtx.state.value;
    const [state, setState] = useState<T>(() => parse(value));

    useEffect(() => {
        setState(parse(value));
    }, [value, setState]);

    const updateStateAndContext = (key: keyof T, val: string, actionType: "SET_VALUE" | "SUBMIT_VALUE") => {
        return new Promise((resolve) =>
            setState((prevState) => {
                // NOTE: without functional setState we cannot edit two list components: one is reset
                const newState = { ...prevState, [key]: val };
                const newValue = compose(newState);
                pickerCtx.dispatch({ type: actionType, payload: newValue });
                resolve(newValue);
                return newState;
            })
        );
    };

    const controls: Partial<ControlsResult<T>> = {
        value: compose(state),
        // TODO: or make functional
        submitCurrentValue: useCallback(
            // TODO: somehow call "beforeSubmit" argument of useControls
            () => {
                setState((state) => {
                    pickerCtx.dispatch({ type: "SUBMIT_VALUE", payload: compose(state) });
                    return state;
                });
            },
            [pickerCtx, compose, state]
        ),
    };
    const keys = Object.keys(state) as (keyof T)[];

    keys.forEach((key) => {
        controls[key] = {
            value: state[key] ?? "",
            setValue: (val: string) => {
                return updateStateAndContext(key, val, "SET_VALUE");
            },
            submitValue: (val: string) => {
                return updateStateAndContext(key, val, "SUBMIT_VALUE");
            },
        };
    });

    return controls as ControlsResult<T>;
}
