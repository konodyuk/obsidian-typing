import Image from "@theme/IdealImage";
import TabItem from "@theme/TabItem";
import Tabs from "@theme/Tabs";
import styles from "./styles.module.css";

const SplitViewOTLPrompt = ({ group, image, children }) => {
    return (
        <Tabs groupId={group}>
            <TabItem value="otl" label="OTL">
                {children}
            </TabItem>
            <TabItem value="prompt" label="Prompt">
                <div className={styles.imageContainer}>
                    <div className={styles.image}>
                        <Image img={require(`../../../static/img/${image}`)} />
                    </div>
                </div>
            </TabItem>
        </Tabs>
    );
};

export default SplitViewOTLPrompt;
