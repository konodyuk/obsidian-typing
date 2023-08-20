import { Upload } from "lucide-react";
import { ChangeEvent, useContext, useState } from "react";
import { FnScript } from "src/scripting";
import styles from "src/styles/prompt.scss";
import { parseFileExtension, parseLinkExtended } from "src/utilities";
import { Contexts, Picker } from ".";
import { Combobox, IComboboxOption, Input } from "../components";
import { useControls } from "../hooks";

function generateFileShortcut(file: File, rename?: FnScript): string {
    if (rename) return rename.call(file);
    return file.name; // TODO: filter disallowed chars
}

export const File = ({
    paths = [],
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
    autoRename?: FnScript;
    short?: boolean;
}) => {
    let controls = useControls({
        parse: parseLinkExtended,
        compose({ folder, name, extension, subpath, display }) {
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

            if (result.length) {
                return `[[${result}]]`;
            } else {
                return "";
            }
        },
    });
    const promptCtx = useContext(Contexts.PromptContext);
    const pickerCtx = useContext(Contexts.PickerContext);

    const [file, setFile] = useState<File>(null);

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
        promptCtx.dispatch({
            type: "CANCEL_UPLOAD",
            payload: { name: controls.name.value },
        });
        promptCtx.dispatch({
            type: "DEFER_UPLOAD",
            payload: { name: value, file, destination: folder },
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
                {!file && (
                    <Combobox
                        static
                        autofocus
                        options={paths}
                        onSetValue={(path) => {
                            let { name, extension } = parseFileExtension(path);
                            controls.name.setValue(name);
                            controls.extension.setValue(extension);
                            if (!short) {
                                controls.folder.setValue(folder);
                            }
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
