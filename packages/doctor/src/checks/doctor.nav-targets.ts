export const id = "doctor.nav-targets";
export const level = "warning";

/** The navigation file engine config names when it sets none. */
const defaultNavigation = "_data/navigation.yml";

const result = (findings) => ({ status: findings.length ? "fail" : "pass", findings });

/** An engine site's navigation link is a path on this site; anything else points away from it. */
const siteLocal = (url) => typeof url === "string" && url.startsWith("/") && !url.startsWith("//");

/** A URL without its query and hash, which do not decide whether the page exists. */
const withoutQuery = (url) => url.replace(/[?#].*$/, "");

/**
 * Checks that every navigation entry points at a page the build wrote. The navigation file comes from the
 * engine config (`navigation`, `_data/navigation.yml` by default), the targets from the build manifest, and
 * each finding carries the line it is on in the navigation file.
 *
 * An app page is not in the manifest, so a target that is missing there is looked up in the output folder;
 * only a target missing from both is reported. Without an output folder or manifest there is nothing to
 * check against, so a run on the source alone reports nothing.
 */
export async function run(site) {
  const config = site.config();
  const path =
    typeof config?.data?.navigation === "string" && config.data.navigation.length > 0
      ? config.data.navigation
      : defaultNavigation;
  if (!site.isFile(site.source, path)) {
    return result([]);
  }

  const parsed = site.dataOf(path);
  if (!parsed || !parsed.data) {
    return result([]);
  }

  const manifestPages = site.pages();
  if (manifestPages.length === 0) {
    return result([]);
  }

  const urls = new Set(manifestPages.map((page) => withoutQuery(page.url)));
  const base = typeof config?.data?.base === "string" ? config.data.base : "";

  /** Whether a site-local URL names a page: in the manifest, or a file the build wrote next to it. */
  function exists(url) {
    const target = withoutQuery(url);
    if (urls.has(target)) return true;
    let output = target;
    if (base && (output === base || output.startsWith(`${base}/`))) {
      output = output.slice(base.length) || "/";
    }
    return site.outputFile(output) !== null;
  }

  const findings = [];

  function checkUrl(url, keyPath) {
    if (!siteLocal(url) || exists(url)) return;
    findings.push({
      in: "source",
      file: path,
      line: parsed.lineOf(keyPath),
      message: `navigation entry \`${url}\` points at a page that does not exist`,
    });
  }

  function walk(value, keyPath) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, [...keyPath, index]));
    } else if (value && typeof value === "object") {
      if (typeof value.url === "string") {
        checkUrl(value.url, [...keyPath, "url"]);
      }
      for (const [key, child] of Object.entries(value)) {
        if (key !== "url") walk(child, [...keyPath, key]);
      }
    }
  }

  walk(parsed.data, []);

  return result(findings);
}
