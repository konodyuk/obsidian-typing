import React, { Component, createRef } from "react";

export class TextArea extends Component {
    state: { value: string; receivedEnter: boolean };
    private textArea = createRef<HTMLTextAreaElement>();

    constructor(
        public props: {
            submitCallback: { (value: string): void };
            setValueCallback: { (value: string): void };
            className: string;
            responsive: boolean;
            value: string;
        }
    ) {
        super(props);
        this.state = {
            value: props.value,
            receivedEnter: false,
        };
    }
    autoResize = () => {
        this.textArea.current.style.height = "0px";
        const scrollHeight = this.textArea.current.scrollHeight;
        this.textArea.current.style.height = scrollHeight + "px";
    };

    componentDidMount() {
        this.autoResize();
        this.textArea.current.focus();
    }

    render() {
        return (
            <textarea
                ref={this.textArea}
                className={this.props.className}
                value={this.state.value}
                onChange={(event) => {
                    this.setState({ value: event.target.value });
                    this.props.setValueCallback(event.target.value);
                    this.autoResize();
                }}
                onKeyUp={(event) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        if (this.state.receivedEnter) {
                            this.props.submitCallback(this.state.value);
                        }
                    }
                }}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        this.setState({ receivedEnter: true });
                        event.preventDefault();
                    }
                }}
            />
        );
    }
}
