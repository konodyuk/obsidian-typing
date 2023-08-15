import Link from "@docusaurus/Link";
import DefaultCodeBlock from "@theme-original/CodeBlock";
import parse from "html-react-parser";
import { useEffect, useRef, useState } from "react";

function LinkableCodeBlock(props) {
    const { links } = props;
    const codeRef = useRef(null);
    const [parsedContent, setParsedContent] = useState(null);

    useEffect(() => {
        if (codeRef.current) {
            const rawHtml = codeRef.current.innerHTML;

            const parsed = parse(rawHtml, {
                replace: (domNode) => {
                    if (domNode.type === "text" && domNode.data) {
                        for (const term in links) {
                            const termIdentifier = "#" + term;
                            if (domNode.data.includes(termIdentifier)) {
                                const parts = domNode.data.split(termIdentifier);
                                return (
                                    <>
                                        {parts[0]}
                                        <Link to={links[term]}>{term}</Link>
                                        {parts.slice(1).join(termIdentifier)}
                                    </>
                                );
                            }
                        }
                    }
                },
            });

            setParsedContent(parsed);
        }
    }, []);

    return <div ref={codeRef}>{parsedContent || <DefaultCodeBlock {...props} />}</div>;
}

export default LinkableCodeBlock;
