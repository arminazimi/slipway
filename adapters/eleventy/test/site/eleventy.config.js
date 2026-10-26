import slipway from "slipway-eleventy";
import markdownItAnchor from "markdown-it-anchor";

export default function(eleventyConfig) {
  eleventyConfig.addPlugin(slipway);
  // Add a markdown-it plugin to generate IDs on headings, as the tests expect it
  eleventyConfig.amendLibrary("md", (mdLib) => {
    mdLib.use(markdownItAnchor, {
      slugify: s => s.trim().toLowerCase().replace(/\s+/g, '-')
    });
  });
  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
