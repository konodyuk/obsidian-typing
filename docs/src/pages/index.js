import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import CodeBlock from "@theme/CodeBlock";
import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import clsx from "clsx";
import { dedent } from "../utils/dedent";
import styles from "./index.module.css";

function HomepageHeader() {
    return (
        <header className={clsx("hero_syme", styles.heroBanner)}>
            <Heading as="h1">
                <div class={styles.heroContainer}>
                    <div>
                        <img src={useBaseUrl("/img/logo-filled.min.svg")} width={200} height={200} />
                    </div>
                    <div class={clsx(styles.heroText)}>
                        <h1 className="hero__title">Obsidian Typing</h1>
                        <p className={clsx("hero__subtitle", styles.heroSubtitle)}>
                            The most comprehensive tool to customize groups of notes in Obsidian
                        </p>
                        <div class={styles.indexCtas}>
                            <Link to="/docs/installation" class="button button--secondary">
                                Installation
                            </Link>
                            <Link to="/docs/quick-start" class="button button--primary">
                                Quick Start
                            </Link>
                            <div className={styles.indexCtasGitHubButtonWrapper}>
                                <iframe
                                    className={styles.indexCtasGitHubButton}
                                    src="https://ghbtns.com/github-btn.html?user=konodyuk&amp;repo=obsidian-typing&amp;type=star&amp;count=true&amp;size=large"
                                    width={160}
                                    height={30}
                                    title="GitHub Stars"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Heading>
        </header>
    );
}

export default function Home() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout title={`Hello from ${siteConfig.title}`} description="Description will go into a meta tag in <head />">
            <HomepageHeader />
            <main>
                <div class="hero hero--dark">
                    <div class="container">
                        <div class="row">
                            <div class="col vert-center">
                                <h1 class="hero__title">Configuration as Code</h1>
                                <p class="hero__subtitle">
                                    Unleash the Obsidian Typing Language (OTL) for Ultimate Customization:
                                    <ul className="margin-top--sm">
                                        <li>
                                            <b>Starting Out:</b> Quickly categorize notes with specific folders, icons,
                                            and field structures. Experience a more structured and personalized
                                            note-taking journey.
                                        </li>
                                        <li>
                                            <b>Going Deeper:</b> Dive deep with advanced customizations, utilizing
                                            complex note type inheritance and beyond. Customize Obsidian intricately to
                                            your workflows and imagination.
                                        </li>
                                    </ul>
                                </p>
                            </div>
                            <div class="col">
                                <CodeBlock language="otl">
                                    {dedent(`
                                    import { Hierarchical } from "../hierarchical"
                                    import { Actionable } from "../actionable"

                                    type Issue extends Hierarchical, Actionable {
                                        folder = "typed/issues"
                                        prefix = "I-{serial}"

                                        fields {
                                            tags: List[Tag[dynamic=true]]
                                            due: Date
                                        }

                                        style {
                                            header = fn"""..."""
                                            link = fn"""..."""
                                            css_classes = ["max-width"]
                                        }

                                        hooks {
                                            on_create = fn"""..."""
                                            on_open = fn"""..."""
                                        }

                                        methods {
                                            children = expr"""..."""
                                        }
                                    }
                                `)}
                                </CodeBlock>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="hero">
                    <div class="container">
                        <div class={clsx("row", styles.rowReverse)}>
                            <div class="col col--4">
                                <h1 class="hero__title">Field Types</h1>
                                <p class="hero__subtitle">
                                    Precisely define field types for every note type, ensuring consistent structure
                                    across notes. Benefit from an intuitive UI, making both note creation and
                                    modifications streamlined and user-friendly.
                                </p>
                            </div>
                            <div class="col col--4">
                                <center>
                                    <img className={styles.imgDemo} src={useBaseUrl("/img/issue-prompt-1-3.png")} />
                                </center>
                            </div>
                            <div class="col col--4">
                                <CodeBlock language="otl">
                                    {dedent(`
                                    type Issue {
                                        folder = "typed/issues"
                                        icon = "far fa-circle-dot"
                                        prefix = "I-{serial}"

                                        fields {
                                            status: Choice["backlog", "open", "closed"] = "backlog"
                                            priority: Number[min=1, max=5] = 2
                                            in: Note["Project", "Issue"]
                                            deps: List[Note["Issue"]]
                                            tags: List[Tag[dynamic=true]]
                                            due: Date
                                        }
                                    }
                                `)}
                                </CodeBlock>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="hero hero--dark">
                    <div class="container">
                        <div class="row margin-bottom--md">
                            <div class="col col--6 vert-center">
                                <h1 class="hero__title">Headers & Footers</h1>
                                <p class="hero__subtitle">
                                    Enhance your notes using auto-injected React components or Markdown content in
                                    headers and footers, avoiding unnecessary template clutter.
                                </p>
                            </div>
                            <div class="col col--6">
                                <CodeBlock language="otl">
                                    {dedent(`
                                    type Issue {
                                        style {
                                            header = fn"""
                                                import {Breadcrumb} from "packages/breadcrumb"
                                                import {Wikihead} from "packages/wiki"
                                                return <>
                                                    <Breadcrumb note={note} base={"apps/Issues.md"} />
                                                    <Wikihead note={note} exclude={["in"]} />
                                                </>
                                            """
                                            footer = fn"""
                                                import {IssueFooter} from "./footer"
                                                return <IssueFooter note={note} />
                                            """
                                        }
                                    }
                                `)}
                                </CodeBlock>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col col--6">
                                <center>
                                    <h2>Source Mode</h2>
                                </center>
                                <CodeBlock language="markdown">
                                    {dedent(`
                                    status :: active
                                    priority :: 4
                                    in :: [[PRJ Project One]]
                                    due :: 2023-10-31
                                    deps :: [[I-1 Do this]], [[I-4 Write docs!!!]]
                                    tags :: "refactor",

                                    Subtasks:
                                    - [ ] one
                                    - [ ] two
                                `)}
                                </CodeBlock>
                            </div>
                            <div class="col col--6">
                                <center>
                                    <h2>Preview Mode</h2>

                                    <img
                                        className={styles.imgDemo}
                                        src={useBaseUrl("/img/issue-header-footer-1.png")}
                                    />
                                </center>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="hero">
                    <div class="container">
                        <div class={clsx("row", styles.rowReverse)}>
                            <div class="col col--6 vert-center">
                                <h1 class="hero__title">Interactive Links</h1>
                                <p class="hero__subtitle">
                                    Replace internal links with dynamic React components. Visualize "Project" statuses
                                    or display avatars for "Person" notes seamlessly.
                                </p>
                                <center className="margin-top--lg">
                                    <h2>Source Mode</h2>
                                </center>
                                <CodeBlock language="markdown">
                                    {dedent(`
                                    - Discussed [[PRJ Project One]] with [[@ElonMusk]] and [[@JohnDoe]]
                                `)}
                                </CodeBlock>
                                <center>
                                    <h2>Preview Mode</h2>
                                    <img className={styles.imgDemo} src={useBaseUrl("/img/links-1.png")} />
                                </center>
                            </div>
                            <div class="col col--6">
                                <CodeBlock language="otl">
                                    {dedent(`
                                    type Person {
                                        style {
                                            link = fn"""
                                                import {Container, Avatar, Icon} from "./utils.tsx"

                                                const abbrev = note.page.name[0] + note.page.surname[0];
                                                const photo = note.methods.photo();
                                                if (photo)
                                                    return <Container><Avatar src={src} />{abbrev}</Container>;
                                                }
                                                return <Container><Icon className="far fa-user" />{abbrev}</Container>;
                                            """
                                        }
                                        methods {
                                            photo = fn"""() => {
                                                const page = note.page
                                                if (!page.photo) return;

                                                const vault = api.app.vault;
                                                const tfile = vault.getAbstractFileByPath(page.photo.path)
                                                if (!tfile) return;

                                                return vault.getResourcePath(tfile)
                                            }"""
                                        }
                                    }
                                `)}
                                </CodeBlock>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="hero hero--dark">
                    <div class="container">
                        <div class={clsx("row")}>
                            <div class="col vert-center">
                                <h1 class="hero__title">CSS Classes or Code</h1>
                                <p class="hero__subtitle">
                                    Bypass individual note styling in Obsidian. Apply CSS classes or inject CSS code
                                    across the entire note types.
                                </p>
                            </div>
                            <div class="col">
                                <CodeBlock language="otl">
                                    {dedent(`
                                    type A extends B {
                                        style {
                                            css = css"""
                                                & a {
                                                    text-decoration: underline
                                                }
                                            """
                                            css_classes = ["max-width", "cards"]
                                        }
                                    }
                                `)}
                                </CodeBlock>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="hero">
                    <div class="container">
                        <div class={clsx("row", styles.rowReverse)}>
                            <div class="col col--4 vert-center">
                                <h1 class="hero__title">Dynamic Prefixes</h1>
                                <p class="hero__subtitle">
                                    Craft personalized note naming conventions with versatile prefixes. From serial
                                    numbers to compact dates and beyond, tailor your prefixes to your needs.
                                </p>
                            </div>
                            <div class="col col--4">
                                <CodeBlock language="otl">
                                    {dedent(`
                                    type Meeting {
                                        prefix = "MTN-{serial}"
                                    }
                                `)}
                                </CodeBlock>
                                <b>Serial number:</b>
                                <ul>
                                    <li>
                                        <code>MTN-1</code>
                                    </li>
                                    <li>
                                        <code>MTN-2</code>
                                    </li>
                                    <li>
                                        <code>MTN-3</code>
                                    </li>
                                    <li>...</li>
                                </ul>
                            </div>
                            <div class="col col--4">
                                <CodeBlock language="otl">
                                    {dedent(`
                                    type Meeting {
                                        prefix = "MTN-{date_compact}"
                                    }
                                `)}
                                </CodeBlock>
                                <b>Leverage Zettelkasten-style prefixes in a compact form:</b>
                                <ul>
                                    <li>
                                        <code>MTN-M1A9WM</code>
                                    </li>
                                    <li>
                                        <code>MTN-N6BF3d</code>
                                    </li>
                                    <li>
                                        <code>MTN-N869mz</code>
                                    </li>
                                    <li>...</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="hero hero--dark">
                    <div class="container">
                        <div class={clsx("row")}>
                            <div class="col col--4 vert-center">
                                <h1 class="hero__title">Advanced Scripting & Module System</h1>
                                <p class="hero__subtitle">
                                    Effortlessly import OTL types and [J/T]S[X] symbols with intuitive syntax. Rapidly
                                    develop your headers, while we watch module changes and refresh your components in
                                    real time.
                                </p>
                            </div>
                            <div class="col col--4">
                                <CodeBlock language="otl" title="typing.otl">
                                    {dedent(`
                                    import {A} from "packages/a"
                                `)}
                                </CodeBlock>
                                <CodeBlock language="otl" title="packages/a/index.otl">
                                    {dedent(`
                                    import {B} from "packages/b"
                                    type A extends B {
                                        style {
                                            header = fn"""
                                                import {Breadcrumb} from "./breadcrumb"
                                                return <Breadcrumb note={note} />
                                            """
                                        }
                                    }
                                `)}
                                </CodeBlock>
                            </div>
                            <div class="col col--4">
                                <CodeBlock language="tsx" title="packages/a/breadcrumb.tsx">
                                    {dedent(`
                                    import * as Utils from "packages/utils"
                                    export const Breadcrumb = ({note}) => {
                                        // ...
                                    }
                                `)}
                                </CodeBlock>
                                <CodeBlock language="tsx" title="packages/utils/index.js">
                                    {dedent(`
                                        export function do_something() {
                                            return "something"
                                        }
                                `)}
                                </CodeBlock>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="hero">
                    <div class="container">
                        <div class={clsx("row", styles.rowReverse)}>
                            <div class="col vert-center">
                                <h1 class="hero__title">Full-featured OTL Editor</h1>
                                <p class="hero__subtitle">
                                    Discover OTL with confidence. Enjoy syntax autocompletion, handy widgets, and
                                    real-time linting, making OTL development a breeze.
                                </p>
                            </div>
                            <div class="col">
                                <center>
                                    <img className={styles.imgDemo} src={useBaseUrl("/img/editor-2.png")} />
                                </center>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="hero hero--dark">
                    <div class="container">
                        <div class="row">
                            <div class="col col--6 vert-center">
                                <h1 class="hero__title">Community Packages</h1>
                                <p class="hero__subtitle">
                                    An ecosystem of packages awaits! Create them to share your vision, or install to
                                    improve your workflow.
                                </p>
                            </div>
                            <div class="col col--6">
                                <p>
                                    <b>Use packages as easily as:</b>
                                </p>
                                <CodeBlock language="otl" title="typing.otl">
                                    {dedent(`
                                    import { Issue, Project, _IssuesApp } from "konodyuk:issues@1.0"
                                `)}
                                </CodeBlock>
                                <CodeBlock language="md" title="apps/Issues.md">
                                    {dedent(`
                                        ---
                                        _type: _IssuesApp
                                        ---
                                `)}
                                </CodeBlock>
                            </div>
                        </div>
                    </div>
                </div>
                <div class={clsx("hero", "", styles.heroBanner)}>
                    <div class="container">
                        <h1 class="hero__title">...And More. Get Started</h1>
                        <div class={styles.indexCtas}>
                            <Link to="/docs/installation" class="button button--secondary">
                                Installation
                            </Link>
                            <Link to="/docs/quick-start" class="button button--primary">
                                Quick Start
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </Layout>
    );
}
