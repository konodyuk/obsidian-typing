import { Upload } from "lucide-react";
import { ChangeEvent, useContext, useState } from "react";
import styles from "src/styles/prompt.scss";
import { parseFileExtension, parseLinkExtended } from "src/utilities";
import { Contexts, Picker } from ".";
import { Combobox, IComboboxOption, Input } from "../components";
import { useControls } from "../hooks";

function generateFileShortcut(file: File, rename?: (file: File) => string): string {
    if (rename) return rename(file);
    return file.name; // TODO: filter disallowed chars
}

export const File = ({
    paths = [],
    search = true,
    upload = true,
    subpath = false,
    display = false,
    preview,
    folder,
    accept,
    capture,
    autoRename,
    short,
}: {
    folder: string;
    paths?: IComboboxOption[];
    subpath?: boolean;
    display?: boolean;
    preview?: (value: string) => any;
    accept?: string;
    capture?: any;
    upload?: boolean;
    autoRename?: (file: File) => string;
    short?: boolean;
    search?: boolean;
}) => {
    const composeWithoutBrackets = ({ folder, name, extension, subpath, display }) => {
        let result = "";
        let path;

        if (extension) {
            name = `${name}.${extension}`;
        }

        if (folder) {
            path = `${folder}/${name}`;
        } else {
            path = name;
        }

        if (path) result += path;
        if (subpath) result += `#${subpath}`;
        if (display) result += `|${display}`;

        return result;
    };
    const compose = (options) => {
        let result = composeWithoutBrackets(options);
        if (result.length) {
            return `[[${result}]]`;
        } else {
            return "";
        }
    };
    let controls = useControls({
        parse: parseLinkExtended,
        compose,
    });
    const promptCtx = useContext(Contexts.PromptContext);
    const pickerCtx = useContext(Contexts.PickerContext);

    const [file, setFile] = useState<File>(null);

    if (file == null) {
        let filename = composeWithoutBrackets({ name: controls.name.value, extension: controls.extension.value });
        let uploadSpec = promptCtx.state?.uploads?.find((value) => {
            return (short || value.destination == controls.folder.value) && value.name == filename;
        });
        if (uploadSpec != null) {
            setFile(uploadSpec.file);
        }
    }

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        let oldFile = file;
        if (!e.target.files) return;
        for (let newFile of e.target.files) {
            let filenameInVault = await generateFileShortcut(newFile, autoRename);
            let { name, extension } = parseFileExtension(filenameInVault);

            // if (inList) {
            //     pickerCtx.dispatch({ type: "SET_VALUE", payload: pickerCtx.state.value + `, ${link}` });
            // }

            controls.name.setValue(name);
            controls.extension.setValue(extension);

            if (!short) {
                controls.folder.setValue(folder);
            }
            if (oldFile) {
                promptCtx.dispatch({
                    type: "CANCEL_UPLOAD",
                    payload: { name: await generateFileShortcut(oldFile, autoRename) },
                });
            }
            if (newFile) {
                promptCtx.dispatch({
                    type: "DEFER_UPLOAD",
                    payload: { name: filenameInVault, file: newFile, destination: folder },
                });
            }
            setFile(newFile);
        }
    };

    let options = {};
    if (accept != null) {
        options.accept = accept;
    }
    if (capture != null) {
        options.capture = capture;
    }
    if (capture != null) {
        options.capture = capture;
    }
    // if (state.inList) {
    //     options.multiple = true;
    // }

    const updateUploads = (value: string) => {
        const oldFilename = `${controls.name.value}.${controls.extension.value}`;
        const newFilename = `${value}.${controls.extension.value}`;
        promptCtx.dispatch({
            type: "CANCEL_UPLOAD",
            payload: { name: oldFilename },
        });
        promptCtx.dispatch({
            type: "DEFER_UPLOAD",
            payload: { name: newFilename, file, destination: folder },
        });
    };

    const id = `file-upload-${pickerCtx.state.fieldName}`;
    return (
        <Picker>
            <Picker.Display value={controls.value} />
            <Picker.Body>
                {upload && (
                    <div className={styles.pickerFile}>
                        <input
                            type="file"
                            className={styles.pickerFileInput}
                            id={id}
                            onChange={handleFileChange}
                            onBlur={(e) => {
                                if (e.relatedTarget == null) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                            }}
                            {...options}
                        />
                        <label for={id} class={styles.pickerFileLabel} tabIndex={-1}>
                            <Upload size={16} />
                        </label>
                    </div>
                )}
                {search && !file && (
                    <Combobox
                        static
                        autofocus
                        options={paths}
                        value={composeWithoutBrackets({
                            // folder: controls.folder.value,
                            name: controls.name.value,
                            extension: controls.extension.value,
                        })}
                        onSetValue={(path) => {
                            let { name, extension } = parseFileExtension(path);
                            controls.name.setValue(name);
                            controls.extension.setValue(extension);
                            if (!short) {
                                controls.folder.setValue(folder);
                            }
                        }}
                        onSubmitValue={(path) => {
                            let { name, extension } = parseFileExtension(path);
                            controls.extension.setValue(extension);
                            if (!short) {
                                controls.folder.setValue(folder);
                            }
                            controls.name.submitValue(name);
                        }}
                        preview={preview}
                        placeholder="Search"
                    />
                )}
                {file && (
                    <>
                        <Input
                            control={controls.name}
                            autofocus
                            onSetValue={(value) => {
                                updateUploads(value);
                                controls.name.setValue(value);
                            }}
                            onSubmitValue={(value) => {
                                updateUploads(value);
                                controls.name.submitValue(value);
                            }}
                            preview={(name) =>
                                preview(
                                    compose({
                                        name,
                                        extension: controls.extension.value,
                                    })
                                )
                            }
                            placeholder="Rename"
                        />
                    </>
                )}
                {subpath && (
                    <>
                        #
                        <Input control={controls.subpath} onChange={controls.subpath.setValue} placeholder="Subpath" />
                    </>
                )}
                {display && (
                    <>
                        |
                        <Input control={controls.display} onChange={controls.display.setValue} placeholder="Display" />
                    </>
                )}
                <Picker.SubmitButton controls={controls} />
            </Picker.Body>
        </Picker>
    );
};
