import classNames from "classnames";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Platform, prepareFuzzySearch } from "obsidian";
import { useRef, useState } from "react";
import styles from "src/styles/prompt.scss";
import { Dropdown, Input } from ".";
import { ControlSpec } from "../hooks/controls";

export interface IComboboxOption {
    value: string;
    label?: string;
    display?: (value: string) => JSX.Element;
}

export const Combobox = ({
    options,
    dynamic,
    maxOptions = 10,
    onSetValue,
    onSubmitValue,
    value,
    control,
    static: static_,
    open,
    preview,
    ...props
}: {
    value?: string;
    options: IComboboxOption[];
    dynamic?: boolean;
    maxOptions?: number;
    onSetValue?: (value: string) => void;
    onSubmitValue?: (value: string) => void;
    control?: ControlSpec;
    static?: boolean;
    open?: boolean;
    preview?: (value: string) => any;
}) => {
    const numOptions = maxOptions;
    // const [numOptions, setNumOptions] = useState(maxOptions);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1); // Index of currently active option
    const [dropdownActive, setDropdownActive] = useState(open ?? true);
    const [offset, setOffset] = useState(0);
    const ref = useRef();

    const filterHook = () => {
        let fuzzy = prepareFuzzySearch(query);
        let filtered = query.length
            ? options
                  .map((option) => ({ option, match: fuzzy(option.label ?? option.value) }))
                  .filter((x) => x.match != null)
                  .sort((a, b) => b.match.score - a.match.score)
                  .map((x) => x.option)
            : options;

        let indexOfValue = filtered.findIndex((x) => x.value == value);
        if (indexOfValue != -1) {
            let valueEl = filtered.splice(indexOfValue, 1);
            filtered.splice(0, 0, ...valueEl);
        }
        return filtered;
    };
    let allFilteredOptions = query.length ? filterHook() : options;
    let filteredOptions = allFilteredOptions.slice(offset, offset + numOptions);
    // let filteredOptions =
    //     numOptions < allFilteredOptions.length ? allFilteredOptions.slice(0, numOptions) : allFilteredOptions;

    const handleArrowNavigation = (direction) => {
        const newActiveIndex = activeIndex + direction;

        if (newActiveIndex < 0) {
            setOffset(Math.max(offset - maxOptions, 0));
        } else if (newActiveIndex >= maxOptions) {
            const maxOffset = allFilteredOptions.length - maxOptions;
            setOffset(Math.min(offset + maxOptions, maxOffset));
            // setOffset(Math.min(offset + 1, maxOffset));
        } else {
            setActiveIndex(newActiveIndex);
        }
    };

    const onSetValueHandler = onSetValue ?? control?.setValue;
    const onSubmitValueHandler = onSubmitValue ?? control?.submitValue ?? onSetValueHandler;

    return (
        <Dropdown ref={ref} active={dropdownActive}>
            <Input
                isActive={dropdownActive}
                value={query}
                onChange={(value, e) => {
                    setQuery(value);
                    setActiveIndex(0); // Reset active index when query changes
                    setOffset(0);
                }}
                onSetValue={(value) => {}}
                preview={preview}
                onBeforeFocus={() => {
                    if (!dropdownActive) setDropdownActive(true);
                    return true;
                }}
                onBeforeBlur={(e) => {
                    if (dropdownActive && !ref?.current?.base?.contains(e?.relatedTarget)) {
                        setDropdownActive(false);
                    }
                    return true;
                }}
                onBeforeKeyDown={(e) => {
                    switch (e.key) {
                        case "ArrowDown":
                            e.stopPropagation();
                            e.preventDefault();
                            if (activeIndex < filteredOptions.length) {
                                setActiveIndex(activeIndex + 1);
                            } else if (offset + numOptions < allFilteredOptions.length) {
                                setOffset(offset + 1);
                                setActiveIndex(activeIndex); // keep active index the same when scrolling
                            }
                            return true;
                        case "ArrowUp":
                            e.stopPropagation();
                            e.preventDefault();
                            if (activeIndex > 0) {
                                setActiveIndex(activeIndex - 1);
                            } else if (offset > 0) {
                                setOffset(offset - 1);
                                setActiveIndex(0); // set active index to top when scrolling up
                            }
                            return true;
                        case "Enter":
                            e.stopPropagation();
                            e.preventDefault();
                            if (!dropdownActive) {
                                setDropdownActive(true);
                                return true;
                            }
                            if (activeIndex >= 0) {
                                let newValue = filteredOptions[activeIndex]?.value;
                                if (!newValue) {
                                    if (dynamic) newValue = query;
                                    else return;
                                }
                                setQuery(newValue);
                                if (e.metaKey) {
                                    onSubmitValueHandler(newValue);
                                } else {
                                    onSetValueHandler(newValue);
                                }
                                setDropdownActive(false);
                                setOffset(0);
                                setActiveIndex(0);
                            }
                            return true;
                        case "Escape":
                            if (dropdownActive) {
                                e.preventDefault();
                                e.stopPropagation();
                                setDropdownActive(false);
                                setOffset(0);
                                setActiveIndex(0);
                                return true;
                            }
                            return true;
                        default:
                            return false;
                    }
                }}
                {...props}
            />
            <Dropdown.Panel static={static_}>
                {offset > 0 && (
                    <div
                        tabIndex={-1}
                        class={styles.comboboxChevronContainer}
                        onClick={() => handleArrowNavigation(-1)}
                    >
                        <ChevronUp size={Platform.isMobile ? 24 : 12} />
                    </div>
                )}
                <div as="div" tabIndex={-1} className={styles.comboboxContainer}>
                    {filteredOptions.map((opt, index) => (
                        <div
                            key={opt.value}
                            className={classNames(`suggestion-item`, `mod-complex`, styles.comboboxSuggestion, {
                                "is-selected": activeIndex === index,
                            })}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setQuery(opt.value);
                                setActiveIndex(0);
                                if (e.metaKey) {
                                    onSubmitValueHandler(opt.value);
                                } else {
                                    onSetValueHandler(opt.value);
                                }
                                setDropdownActive(false);
                            }}
                            tabIndex={-1}
                        >
                            <div tabIndex={-1} className={"suggestion-content"}>
                                {opt.display ? opt.display(opt.value) : opt.label || opt.value}
                            </div>
                            {value === opt.value && (
                                <div tabIndex={-1} className="suggestion-aux">
                                    <kbd tabIndex={-1} className="far fa-check" />
                                </div>
                            )}
                        </div>
                    ))}
                    {dynamic && query.length > 0 && !filteredOptions.some((x) => x.value === query) && (
                        <div
                            className={classNames(`suggestion-item`, styles.comboboxSuggestion, {
                                "is-selected": activeIndex === filteredOptions.length,
                            })}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setQuery(query);
                                setActiveIndex(0);
                                if (e.metaKey) {
                                    onSubmitValueHandler(query);
                                } else {
                                    onSetValueHandler(query);
                                }
                                setDropdownActive(false);
                            }}
                            tabIndex={-1}
                        >
                            <div className={"suggestion-content"}>Create "{query}"</div>
                        </div>
                    )}
                    {offset + numOptions < allFilteredOptions.length && (
                        <div
                            tabIndex={-1}
                            class={styles.comboboxChevronContainer}
                            onClick={() => handleArrowNavigation(+1)}
                        >
                            <ChevronDown size={Platform.isMobile ? 24 : 12} />
                        </div>
                    )}
                </div>
            </Dropdown.Panel>
        </Dropdown>
    );
};
