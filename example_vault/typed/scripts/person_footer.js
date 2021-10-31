let pages = dv
    .pages('"typed/meetings"')
    .where((p) => {
        if (!p.members) {
            return false;
        }
        if (dv.value.isLink(p.members)) {
            return areLinksEqual(p.members, note.fields.file.link);
        }
        if (dv.value.isArray(p.members)) {
            for (let link of p.members) {
                if (areLinksEqual(link, note.fields.file.link)) {
                    return true;
                }
            }
        }
        return false;
    })
    .map((p) => p.file.link);

if (pages.length) {
    let contentEl = containerEl.createDiv({ cls: "typing-footer-content" });
    md("## Meetings", contentEl);
    dv.list(pages, contentEl, null, note.path);
}
