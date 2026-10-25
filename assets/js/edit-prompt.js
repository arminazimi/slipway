/* "Edit with your agent": a button on each heading with data-source copies a prompt with the file,
   line, and section text (to the next heading of its level). */
(function () {
  function build(tpl, src, text) {
    text = text.replace(/\s+/g, " ").trim();
    return tpl.replace("{source}", src).replace("{text}", function () { return text; }) + " ";
  }

  globalThis.slipwayEdit = { build: build };
  if (!globalThis.document || !navigator.clipboard) return;
  var o = document.body.dataset;
  document.querySelectorAll("[data-edit-prompt] [data-source]").forEach(function (h) {
    var d = h.closest("[data-edit-prompt]").dataset, b = document.createElement("button"), t = h.textContent, e = h;
    while ((e = e.nextElementSibling) && e.tagName != "NAV" && !(/^H\d/.test(e.tagName) && e.tagName <= h.tagName)) t += " " + e.textContent;
    b.className = "sl-edit";
    b.textContent = d.editLabel;
    b.onclick = function () {
      navigator.clipboard.writeText(build(d.editPrompt, h.dataset.source, t)).then(function () { b.textContent = o.copied; }, function () { b.textContent = o.copyFailed; });
      setTimeout(function () { b.textContent = d.editLabel; }, 2000);
    };
    h.appendChild(b);
  });
})();
