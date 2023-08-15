import Admonition from "@theme-original/Admonition";
import { Check } from "lucide-react";
import styles from "./styles.module.css";

export default function AdmonitionWrapper(props) {
    if (props.type === "success") {
        return <Admonition icon={<Check className={styles.nofill} />} {...props} />;
    }
    return <Admonition {...props} />;
}
