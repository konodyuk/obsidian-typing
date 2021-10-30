import React, { Component } from "react";
import { Platform } from "obsidian";
import { PrefixComponent } from "./prefix";

export class ViewTitle extends Component {
    constructor(
        public props: {
            prefix: string | null;
            name: string | null;
            onNameClick: { (): void };
        }
    ) {
        super(props);
    }

    render() {
        let shouldRenderPrefix =
            this.props.prefix && (!Platform.isMobile || !this.props.name);
        let shouldRenderName = this.props.name;
        return (
            <>
                {shouldRenderPrefix ? (
                    <PrefixComponent
                        className="view-header-title typing-view-title-prefix"
                        prefix={this.props.prefix}
                    ></PrefixComponent>
                ) : (
                    {}
                )}
                {shouldRenderName ? (
                    <div
                        className="view-header-title typing-view-title-name"
                        onClick={this.props.onNameClick}
                    >
                        {this.props.name}
                    </div>
                ) : (
                    {}
                )}
            </>
        );
    }
}
