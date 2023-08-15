import LinkableCodeBlock from "../LinkableCodeBlock/";

const LANGUAGE_REF_PAGE = "/docs/reference/language";
const VALUE_TYPES = {
    LOOSE_IDENTIFIER: "#loose-identifier",
    IDENTIFIER: "#identifier",
    EXPR: "#expr",
    CSS: "#css",
    MARKDOWN: "#markdown",
    FIELD_TYPE: "#field-type",
    STRING: "#string",
    FUNCTION: "#function",
    ARRAY: "#array",
    LITERAL: "#literal",
};

let LINKS = {};
for (let key in VALUE_TYPES) {
    LINKS[key] = LANGUAGE_REF_PAGE + VALUE_TYPES[key];
}

const OTLSyntaxCodeBlock = ({ children }) => (
    <LinkableCodeBlock language="otl" links={LINKS}>
        {children}
    </LinkableCodeBlock>
);

export default OTLSyntaxCodeBlock;
