module.exports = {
    sourcemap: false, //"inline",
    minify: true,
    define: {
        "process.env.NODE_ENV": JSON.stringify(process.env.BUILD),
        global: "window",
    },
};
