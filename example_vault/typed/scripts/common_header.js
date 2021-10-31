let breadcrumbEl = containerEl.createDiv({ cls: "typing-header-breadcrumb" });
let contentEl = containerEl.createDiv({ cls: "typing-header-content" });

let currentNote = note.fields;
let breadcrumbPath = "";
while (currentNote.in) {
    if (breadcrumbPath) {
        breadcrumbPath = currentNote.in.markdown() + "->" + breadcrumbPath;
    } else {
        breadcrumbPath = currentNote.in.markdown();
    }
    let parentNotePath = dv.evaluationContext.linkHandler.normalize(
        currentNote.in.path,
        note.path
    );
    currentNote = dv.page(parentNotePath);
}

if (breadcrumbPath) {
    md(
        breadcrumbPath + `->${note.fields.file.link.markdown()}`,
        breadcrumbEl
    ).then(() => {
        // scroll max to right
        breadcrumbEl.scrollLeft = breadcrumbEl.offsetWidth;
    });
}

for (let field of type.fields) {
    let key = field.name;
    let ignored = ["in"];
    if (ignored.contains(key)) {
        continue;
    }
    let value = note.fields[key];
    if (!value) {
        continue;
    }
    let d = contentEl.createDiv({ cls: "keyvalue" });
    d.createDiv({ cls: "key", text: key + ": " });
    console.log(key, "val", value);
    dv.renderValue(value, d.createDiv({ cls: "value" }), null, note.path);
}
if (!contentEl.children.length) {
    containerEl.removeChild(contentEl);
}
