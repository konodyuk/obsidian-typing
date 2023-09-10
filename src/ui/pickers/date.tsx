import { useRef, useState } from "react";
import { default as ReactDatePicker } from "react-datepicker";
import "src/styles/react-datepicker.notranspile.scss";
import { parseDate } from "src/utilities";
import { Picker } from ".";
import { Dropdown, Input } from "..";
import { useControls } from "../hooks";

function toLocalISOString(date: Date) {
    let yyyy = date.getFullYear();
    let mm = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed.
    let dd = String(date.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
}

export function Date() {
    let controls = useControls({
        parse(value) {
            return { str: value };
        },
        compose({ str }) {
            let date = parseDate(str);
            if (!date) return "";
            return toLocalISOString(date);
        },
    });

    let ref = useRef();

    function DummyContainer({ children }) {
        return (
            <div ref={ref} style={{ position: "relative" }}>
                {children}
            </div>
        );
    }

    let [dateQuery, setDateQuery] = useState(controls.value);

    return (
        <Picker>
            <Picker.Display>{controls.value}</Picker.Display>
            <Picker.Body>
                <Dropdown>
                    <Input
                        autofocus
                        value={dateQuery}
                        onSetValue={async (value, e) => {
                            e.preventDefault();
                            setDateQuery(await controls.str.setValue(value));
                        }}
                        onSubmitValue={async (value, e) => {
                            e.preventDefault();
                            setDateQuery(await controls.str.submitValue(value));
                            // dispatch({ type: "EXIT" });
                        }}
                        onChange={(value) => {
                            setDateQuery(value);
                        }}
                        onBeforeKeyDown={(e) => {
                            switch (e.key) {
                                case "ArrowDown":
                                    e.preventDefault();
                                    e.stopPropagation();
                                    let calendarContainer = ref.current;

                                    const selectedDay =
                                        calendarContainer &&
                                        calendarContainer.querySelector('.react-datepicker__day[tabindex="0"]');

                                    selectedDay && selectedDay.focus({ preventScroll: true });

                                    return true;
                                default:
                                    return false;
                            }
                        }}
                    />
                    <Dropdown.Panel static>
                        <ReactDatePicker
                            selected={parseDate(dateQuery)}
                            inline
                            onSelect={async (date) => {
                                let newValue = await controls.str.setValue(toLocalISOString(date));
                                setDateQuery(newValue);
                                // dispatch({ type: "EXIT" });
                            }}
                            onChange={async (date) => {
                                let newValue = await controls.str.setValue(toLocalISOString(date));
                                setDateQuery(newValue);
                            }}
                            calendarContainer={DummyContainer}
                        />
                    </Dropdown.Panel>
                </Dropdown>
                <Picker.SubmitButton controls={controls} />
            </Picker.Body>
        </Picker>
    );
}
