import assert from "node:assert/strict";
import { test } from "node:test";
import { validateSourcemap } from "./sourcemap.mjs";

const page = { url: "/docs/intro.html", source: "_docs/intro.md" };

test("level 0, level 1, and an empty map are accepted", () => {
  const valid = [
    { version: 0, pages: [] },
    { version: 0, pages: [page, { url: "/2026/10/18/hello/", source: "_posts/2026-10-18-hello.md" }] },
    {
      version: 0,
      pages: [
        {
          ...page,
          sections: [
            { id: "install-npm-packages", level: 1, line: 6, text: "Install npm packages" },
            { id: "راستبهچپ", level: 2, line: 23, text: "راست‌به‌چپ" },
          ],
          links: [{ href: "../missing.md", line: 8 }],
        },
      ],
    },
  ];
  for (const data of valid) assert.deepEqual(validateSourcemap(data), { ok: true, errors: [] }, JSON.stringify(data));
});

test("a missing source, line 0, a wrong type, an unknown version, and a duplicate url are rejected", () => {
  const invalid = {
    "missing source": { version: 0, pages: [{ url: "/a/" }] },
    "line 0": { version: 0, pages: [{ ...page, links: [{ href: "/x/", line: 0 }] }] },
    "wrong type": { version: 0, pages: [{ ...page, sections: [{ id: "a", level: 1, line: "6", text: "A" }] }] },
    "unknown version": { version: 1, pages: [] },
    "duplicate url": { version: 0, pages: [page, { ...page, source: "_docs/other.md" }] },
  };
  for (const [name, data] of Object.entries(invalid)) {
    const { ok, errors } = validateSourcemap(data);
    assert.equal(ok, false, name);
    assert.ok(errors.length > 0, name);
  }
  assert.match(validateSourcemap(invalid["duplicate url"]).errors.join("\n"), /\/pages\/1\/url .* more than once/);
});

test("a source outside the site folder is rejected", () => {
  for (const source of ["/etc/passwd", "../secret.md", "_docs/../../x.md", "C:\\docs\\a.md"]) {
    assert.equal(validateSourcemap({ version: 0, pages: [{ url: "/a/", source }] }).ok, false, source);
  }
});
