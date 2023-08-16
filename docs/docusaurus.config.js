// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
const otlGrammarPlugin = require("./src/remark/otl-grammar-plugin.js");
const todoAdmonitionPlugin = require("./src/remark/todo-admonition-plugin.js");

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: "Obsidian Typing",
    tagline: "Obsidian plugin for categorizing notes",
    favicon: "img/logo-filled.min.svg",

    url: "https://konodyuk.github.io/",
    baseUrl: "/obsidian-typing",
    organizationName: "konodyuk", // Usually your GitHub org/user name.
    projectName: "obsidian-typing", // Usually your repo name.
    trailingSlash: false,

    onBrokenLinks: "warn",
    onBrokenMarkdownLinks: "warn",

    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },

    presets: [
        [
            "classic",
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    sidebarPath: require.resolve("./sidebars.js"),
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl: "https://github.com/konodyuk/obsidian-typing/tree/main/docs",
                    beforeDefaultRemarkPlugins: [otlGrammarPlugin, todoAdmonitionPlugin],
                },
                theme: {
                    customCss: require.resolve("./src/css/custom.css"),
                },
                gtag: {
                    trackingID: "G-0TBTNMVSDF",
                    anonymizeIP: true,
                },
            }),
        ],
    ],

    plugins: [
        [
            "@docusaurus/plugin-ideal-image",
            {
                quality: 70,
                max: 1030, // max resized image's size.
                min: 640, // min resized image's size. if original is lower, use that size.
                steps: 2, // the max number of images generated between min and max (inclusive)
                disableInDev: false,
            },
        ],
    ],

    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            colorMode: {
                defaultMode: "dark",
                respectPrefersColorScheme: false,
            },
            navbar: {
                title: "Obsidian Typing",
                logo: {
                    alt: "Obsidian Typing Logo",
                    src: "img/logo-filled.min.svg",
                },
                items: [
                    {
                        type: "docSidebar",
                        sidebarId: "docs",
                        position: "left",
                        label: "Docs",
                    },
                    {
                        href: "https://github.com/konodyuk/obsidian-typing",
                        label: "GitHub",
                        position: "right",
                    },
                ],
            },
            footer: {
                copyright: `Copyright © ${new Date().getFullYear()} Nikita Konodyuk. Built with Docusaurus.`,
            },
            prism: {
                theme: lightCodeTheme,
                darkTheme: darkCodeTheme,
                additionalLanguages: ["markdown"],
            },
            themes: ["@docusaurus/theme-live-codeblock"],
        }),
};

module.exports = config;
