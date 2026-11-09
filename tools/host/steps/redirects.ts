import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function writeRedirects(config, outDir) {
  const redirects = config.redirects || {};
  const written = [];

  for (const [source, target] of Object.entries(redirects)) {
    let relPath = source.startsWith("/") ? source.slice(1) : source;

    if (relPath === "") {
      relPath = "index.html";
    } else if (relPath.endsWith("/")) {
      relPath += "index.html";
    } else if (!relPath.endsWith(".html") && !relPath.endsWith(".htm")) {
      relPath += "/index.html";
    }

    const dest = join(outDir, relPath);
    mkdirSync(dirname(dest), { recursive: true });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting...</title>
<link rel="canonical" href="${target}">
<meta http-equiv="refresh" content="0; url=${target}">
<meta name="robots" content="noindex">
</head>
<body>
<h1>Redirecting...</h1>
<a href="${target}">Click here if you are not redirected.</a>
</body>
</html>`;

    writeFileSync(dest, html, "utf8");
    written.push(relPath);
  }

  return written;
}
