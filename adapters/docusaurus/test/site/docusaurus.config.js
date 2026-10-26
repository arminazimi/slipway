// The test sets SLIPWAY_DOCUSAURUS to this adapter's folder; a real site imports "slipway-docusaurus".
export default async function createConfig() {
  const adapter = process.env.SLIPWAY_DOCUSAURUS ? `${process.env.SLIPWAY_DOCUSAURUS}/src/index.mjs` : "slipway-docusaurus";
  const { default: slipway, remarkSource } = await import(adapter);
  return {
    title: "Fixture",
    url: "https://example.com",
    baseUrl: "/",
    onBrokenLinks: "throw",
    i18n: { defaultLocale: "en", locales: ["en"] },
    presets: [
      [
        "classic",
        {
          docs: { remarkPlugins: [remarkSource] },
          blog: { remarkPlugins: [remarkSource], showReadingTime: false, onUntruncatedBlogPosts: "ignore" },
          pages: { remarkPlugins: [remarkSource] },
          theme: {},
        },
      ],
    ],
    plugins: [slipway],
  };
}
