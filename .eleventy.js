const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");

module.exports = function(eleventyConfig) {
    eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
    return {
      pathPrefix: "/armory/",
      dir: {
        input: "src",
        output: "_site"
      }
    }
  };