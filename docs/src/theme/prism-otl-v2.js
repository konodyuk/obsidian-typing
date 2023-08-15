Prism.languages.otl = {
    comment: {
        pattern: /\/\/.*/,
        greedy: true,
    },
    "class-name": {
        pattern: /(?:abstract\s+)?type\s+(?:".*?"|'.*?'|\w+)/,
        inside: {
            keyword: /^(?:abstract\s+)?type\b/,
            name: /(?:".*?"|'.*?'|\w+)$/,
        },
    },
    extends: {
        pattern: /extends\s+(?:(?:".*?"|'.*?'|\w+)\s*(?:,\s*(?:".*?"|'.*?'|\w+))*)?/,
        inside: {
            keyword: /^extends/,
            name: /(?:".*?"|'.*?'|\w+)/g,
            punctuation: /,/,
        },
    },
    "section-declaration": {
        pattern: /(?:default\s+)?\w+\s*\{/,
        inside: {
            keyword: /^default/,
            keyword: /\w+/,
            punctuation: /\{/,
        },
    },
    assignment: {
        pattern: /\w+\s*:\s*\w+(\s*\[\s*\w+(\s*,\s*\w+)*\s*\])?/,
        inside: {
            name: /^\w+/,
            punctuation: /[:\[\],]/,
            type: /\w+/g,
        },
        greedy: true,
    },
    "tagged-js-string": {
        pattern: /(fn|function|expr)(?:"""|''')[\s\S]*?(?:"""|''')/,
        inside: {
            tag: /^(fn|function|expr)/,
            string: /^(?:"""|''')|(?:"""|''')$/,
            "string-content": {
                pattern: /[\s\S]+/,
                inside: Prism.languages.javascript,
            },
        },
        greedy: true,
    },
    "tagged-md-string": {
        pattern: /(md|markdown)(?:"""|''')[\s\S]*?(?:"""|''')/,
        inside: {
            tag: /^(md|markdown)/,
            string: /^(?:"""|''')|(?:"""|''')$/,
            "string-content": {
                pattern: /[\s\S]+/,
                inside: Prism.languages.markdown,
            },
        },
        greedy: true,
    },
    "tagged-css-string": {
        pattern: /css(?:"""|''')[\s\S]*?(?:"""|''')/,
        inside: {
            tag: /^css/,
            string: /^(?:"""|''')|(?:"""|''')$/,
            "string-content": {
                pattern: /[\s\S]+/,
                inside: Prism.languages.css,
            },
        },
        greedy: true,
    },
    "tagged-string": {
        pattern: /\w+(?:"""|''')[\s\S]*?(?:"""|''')/,
        inside: {
            tag: /^\w+/,
            punctuation: /^(?:"""|''')|(?:"""|''')$/,
            "string-content": {
                pattern: /[\s\S]+/,
                inside: Prism.languages.string,
            },
        },
        greedy: true,
    },
    string: {
        pattern: /(?:"""|''')[\s\S]*?(?:"""|''')|'[^'\r\n]*'|"[^"\r\n]*"/,
        greedy: true,
    },
    boolean: /\b(?:true|false)\b/,

    null: /\bnull\b/,
    number: /\b\d+(?:\.\d+)?/,
    punctuation: /[{}[\];(),.:]/,
    operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    keyword: /\b(?:type|extends|default|import|from)\b/,
};
export default Prism;
