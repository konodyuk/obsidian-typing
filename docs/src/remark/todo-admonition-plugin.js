const visit = require("unist-util-visit");

const plugin = (options) => {
    const transformer = async (ast) => {
        visit(ast, "text", (node) => {
            if (node.value.trim() === "@TODO") {
                node.type = "admonition";
                node.data = {
                    hName: "div",
                    hProperties: {
                        className: "alert alert--warning",
                    },
                };
                node.children = [{ type: "text", value: "TODO" }];
            }
        });
    };
    return transformer;
};

module.exports = plugin;
