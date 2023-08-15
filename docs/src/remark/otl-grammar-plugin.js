const visit = require("unist-util-visit");

function otlGrammarPlugin() {
    return function transformer(tree) {
        visit(tree, "code", (node) => {
            if (node.lang === "otl-grammar") {
                node.type = "jsx";
                node.value = `<OTLSyntaxCodeBlock>
   {${JSON.stringify(node.value)}}
</OTLSyntaxCodeBlock>`;
            }
        });
    };
}

module.exports = otlGrammarPlugin;
