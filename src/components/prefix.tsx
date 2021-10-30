import React, { Component } from "react";

export class PrefixComponent extends Component {
    state: { expanded: boolean };
    constructor(public props: { prefix: string }) {
        super(props);
        this.state = {
            expanded: true,
        };
    }

    render() {
        return (
            <div
                className="typing-modal-name-prefix"
                onClick={() => {
                    this.setState({ expanded: !this.state.expanded });
                }}
            >
                {this.state.expanded ? (
                    this.props.prefix
                ) : (
                    <i className="fas fa-ellipsis"></i>
                )}
            </div>
        );
    }
}
