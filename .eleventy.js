const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const { default: nodeResolve } = require("@rollup/plugin-node-resolve");
const rollupPlugin = require("eleventy-plugin-rollup");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const terser = require("@rollup/plugin-terser");
const CleanCSS = require('clean-css');

module.exports = function(eleventyConfig) {
  eleventyConfig.addFilter("cssmin", function(code) {
    return new CleanCSS({}).minify(code).styles;
  });
  eleventyConfig.addPlugin(rollupPlugin, {
    rollupOptions: {
      output: {
        format: "es",
        dir: "_site/js",
      },
      plugins: [
        nodeResolve({
          modulePaths: ["/app", "/workspaces/armorer"],
        }),
        json(),
        commonjs({
          include: /node_modules/,
          requireReturnsDefault: 'auto', // <---- this solves default issue
        }),
        terser(),
      ]
    },
  });
  eleventyConfig.addPlugin(rollupPlugin, {
    scriptGenerator: (filename) => filename, // do not add <script> tags
    shortcode: "rollup_web_worker",
    rollupOptions: {
      output: {
        format: "es",
        dir: "_site/js",
      },
      plugins: [
        nodeResolve({
          modulePaths: ["/app", "/workspaces/armorer"],
        }),
        json(),
        commonjs({
          include: /node_modules/,
          requireReturnsDefault: 'auto', // <---- this solves default issue
        }),
        terser(),
      ]
    },
  });
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/fonts");
  eleventyConfig.addPassthroughCopy("src/js/*.json");
  eleventyConfig.addPassthroughCopy({ "src/favicon": "/" });
  eleventyConfig.addWatchTarget("src/js/");
  eleventyConfig.addWatchTarget("src/css/styles.css");
  eleventyConfig.addGlobalData("site.base_url", process.env.BASE_URL || "https://armorer.io");
  return {
    dir: {
      input: "src",
      output: "_site"
    }
  }
};