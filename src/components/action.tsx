import React from "react";
import { Action } from "../config";

export const ActionCard = (action: Action, callback: { (): void }) => {
    let content: JSX.Element;
    if (action.display.icon) {
        content = <i className={action.display.icon}></i>;
    } else {
        content = (
            <div className="typing-action-card-name">{action.display.name}</div>
        );
    }
    return (
        <div className="typing-action-card" onClick={callback}>
            {content}
        </div>
    );
};

export const ActionLine = (action: Action, callback: { (): void }) => {
    let slug: JSX.Element;
    if (action.display.icon) {
        slug = <i className={action.display.icon}></i>;
    } else {
        slug = <></>;
    }
    return (
        <div className="typing-action-line" onClick={callback}>
            <div className="typing-action-line-pin">
                {action.pinned ? <i className="fa-regular fa-star"></i> : {}}
            </div>
            <div className="typing-action-line-slug">{slug}</div>
            <div className="typing-action-line-name">{action.name}</div>
        </div>
    );
};
