export function dedent(str) {
    // Split the string into lines
    const lines = str.split("\n");

    // Find the minimum whitespace count at the start of the lines
    const minWhitespaceCount = lines
        .filter((line) => line.trim() !== "") // Exclude empty lines
        .reduce((min, line) => Math.min(min, line.search(/\S/)), Infinity); // Get the first non-whitespace character index

    // Dedent each line
    const dedentedLines = lines.map((line) => line.slice(minWhitespaceCount));

    // Trim the result and return
    return dedentedLines.join("\n").trim();
}
