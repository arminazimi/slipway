export const definition = {
  name: "preview",
  description: "Get instructions on how to preview the site locally.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
};

/** Returns preview instructions. */
export function preview() {
  return {
    instructions: "To build the site locally, give it a Gemfile with gem \"github-pages\", group: :jekyll_plugins, then run:\n\nbundle exec jekyll build\n\nRead every error and warning and fix them the same way. To look at the result, run bundle exec jekyll serve and open the address it prints. Without a Gemfile, push and read the log of the Pages build."
  };
}

export const handler = (site) => preview(site);
