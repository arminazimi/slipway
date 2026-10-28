export const id = "doctor.nav-targets";
export const level = "warning";

const result = (findings) => ({ status: findings.length ? "fail" : "pass", findings });

export async function run(site) {
  const path = "_data/navigation.yml";
  if (!site.isFile(site.source, path)) {
    return result([]);
  }

  const parsed = site.dataOf(path);
  if (!parsed || !parsed.data) {
    return result([]);
  }

  let sourcemap;
  try {
    sourcemap = site.sourcemap();
  } catch (e) {
    return result([]);
  }

  if (!sourcemap) return result([]);
  const pages = new Set((sourcemap.data?.pages || []).map(p => p.url));
  const findings = [];

  let baseurl = "";
  for (const name of ["_config.yml", "_config.yaml"]) {
    if (site.isFile(site.source, name)) {
      const configParsed = site.dataOf(name);
      if (configParsed?.data?.baseurl) {
        baseurl = configParsed.data.baseurl;
      }
      break;
    }
  }

  function checkUrl(url, keyPath) {
    if (!url || typeof url !== "string") return;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")) return;

    let target = url;
    if (baseurl && target.startsWith(baseurl)) {
      target = target.slice(baseurl.length);
    }
    if (!target.startsWith("/")) {
        target = "/" + target;
    }

    if (!pages.has(target)) {
      findings.push({
        in: "source",
        file: path,
        line: parsed.lineOf(keyPath),
        message: `navigation entry \`${url}\` points at a page that does not exist`,
      });
    }
  }

  function walk(obj, keyPath) {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => walk(item, [...keyPath, index]));
    } else if (obj && typeof obj === "object") {
      if (obj.url) {
        checkUrl(obj.url, [...keyPath, "url"]);
      }
      for (const [key, value] of Object.entries(obj)) {
        if (key !== "url") walk(value, [...keyPath, key]);
      }
    }
  }

  walk(parsed.data, []);

  return result(findings);
}
