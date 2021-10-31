let pages = dv
    .pages('""')
    .where((p) => {
        if (!p.in) {
            return false;
        }
        if (dv.value.isLink(p.in)) {
            return areLinksEqual(p.in, note.fields.file.link);
        }
        if (dv.value.isArray(p.in)) {
            for (let link of p.in) {
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
    dv.list(pages, contentEl, null, note.path);
}
