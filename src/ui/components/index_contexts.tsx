import { createContext, useContext } from "react";

export { ListContext } from "../pickers/list";
export { DropdownContext } from "./dropdown";
export { MarkdownRenderingContext } from "./markdown";
export { ModalContext } from "./modal";
export { PickerContext, PickerContextType, PickerState } from "./picker";
export { PromptContext, PromptContextType, PromptState } from "./prompt";

export const MarginalContext = createContext(null);

export const useMarginalContext = () => {
    return useContext(MarginalContext);
};
