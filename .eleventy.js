const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const { default: nodeResolve } = require("@rollup/plugin-node-resolve");
const rollupPlugin = require("eleventy-plugin-rollup");
const commonjs = require("@rollup/plugin-commonjs");
const { default: json } = require("@rollup/plugin-json");

module.exports = function(eleventyConfig) {
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
      ]
    },
  });
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/fonts");
  eleventyConfig.addPassthroughCopy({ "src/favicon": "/" });
  eleventyConfig.addWatchTarget("src/js/");
  return {
    dir: {
      input: "src",
      output: "_site"
    }
  }
};