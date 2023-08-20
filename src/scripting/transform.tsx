function buildImportArgs(path) {
    if (path.node.type === "ExportAllDeclaration") {
        return [
            { type: "StringLiteral", value: path.node.source.value },
            { type: "ArrayExpression", elements: [{ type: "StringLiteral", value: "__star__" }] },
        ];
    }

    return [
        { type: "StringLiteral", value: path.node.source.value },
        {
            type: "ArrayExpression",
            elements: path.node.specifiers.map((specifier) => {
                if (specifier.type === "ImportSpecifier" || specifier.type === "ExportSpecifier") {
                    return {
                        type: "StringLiteral",
                        value: specifier.imported ? specifier.imported.name : specifier.exported.name,
                    };
                } else if (specifier.type === "ImportDefaultSpecifier" || specifier.type === "ExportDefaultSpecifier") {
                    return { type: "StringLiteral", value: "default" };
                } else if (
                    specifier.type === "ImportNamespaceSpecifier" ||
                    specifier.type === "ExportNamespaceSpecifier"
                ) {
                    return { type: "StringLiteral", value: "__star__" };
                }
            }),
        },
    ];
}

function buildDeclarations(path, importArgs, isExport, exportAllAs) {
    const importCall = {
        type: "CallExpression",
        callee: {
            type: "MemberExpression",
            object: { type: "Identifier", name: "api" },
            property: { type: "Identifier", name: "_import_explicit" },
        },
        arguments: importArgs,
    };

    const properties =
        path.node.type === "ExportAllDeclaration"
            ? [
                  {
                      type: "ObjectProperty",
                      key: { type: "Identifier", name: "__star__" },
                      value: { type: "Identifier", name: exportAllAs },
                      computed: false,
                      shorthand: false,
                  },
              ]
            : path.node.specifiers.map((specifier) => {
                  let importedName;
                  let localName;
                  if (specifier.type === "ImportSpecifier" || specifier.type === "ExportSpecifier") {
                      importedName = specifier.imported ? specifier.imported.name : specifier.exported.name;
                      localName = isExport && specifier.exported ? specifier.exported.name : specifier.local.name;
                  } else if (
                      specifier.type === "ImportDefaultSpecifier" ||
                      specifier.type === "ExportDefaultSpecifier"
                  ) {
                      importedName = "default";
                      localName = specifier.local.name;
                  } else if (
                      specifier.type === "ImportNamespaceSpecifier" ||
                      specifier.type === "ExportNamespaceSpecifier"
                  ) {
                      importedName = "__star__";
                      localName = specifier.local.name;
                  }

                  return {
                      type: "ObjectProperty",
                      key: { type: "Identifier", name: importedName },
                      value: { type: "Identifier", name: localName },
                      computed: false,
                      shorthand: importedName === localName,
                  };
              });

    const declarations = {
        type: "VariableDeclaration",
        declarations: [
            {
                type: "VariableDeclarator",
                id: {
                    type: "ObjectPattern",
                    properties: properties,
                },
                init: importCall,
            },
        ],
        kind: "const",
    };

    return isExport
        ? {
              type: "ExportNamedDeclaration",
              declaration: declarations,
          }
        : declarations;
}

export const customImportExportTransform = {
    visitor: {
        ImportDeclaration(path) {
            transformImportDeclaration(path, false);
        },
        ExportNamedDeclaration(path) {
            // Check if it's an "export {...} from 'source'" form
            if (path.node.source) {
                transformImportDeclaration(path, true);
            }
            // If it's not, no need to transform it, it's a simple export
        },
        ExportAllDeclaration(path) {
            transformImportDeclaration(path, true, path.node.exported.name);
        },
    },
};

function transformImportDeclaration(path, isExport, exportAllAs) {
    const importArgs = buildImportArgs(path);
    const declarations = buildDeclarations(path, importArgs, isExport, exportAllAs);
    path.replaceWith(declarations);
}
