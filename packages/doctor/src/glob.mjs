// The glob form of content-schemas.json: `*` matches within one path segment, `**` any number of segments.

/** A RegExp for a glob over forward-slash paths. */
export function globToRegExp(glob) {
  let pattern = "";
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    if (char === "*" && glob[i + 1] === "*") {
      i++;
      if (glob[i + 1] === "/") {
        i++;
        pattern += "(?:.*/)?";
      } else pattern += ".*";
    } else if (char === "*") pattern += "[^/]*";
    else pattern += char.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${pattern}$`);
}

/** Whether a forward-slash path matches any of the globs. */
export function matchesAny(path, globs) {
  return globs.some((glob) => globToRegExp(glob).test(path));
}
