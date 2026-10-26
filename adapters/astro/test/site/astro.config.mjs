import { defineConfig } from "astro/config";
import slipway from "../../src/index.mjs";

export default defineConfig({
  site: "https://example.com",
  integrations: [slipway()],
});
