/* Client-side search over the language's search.json. The field is hidden until this script runs, so a page
   needs no JavaScript to be read. Persian-aware: ي/ك become ی/ک, ZWNJ and diacritics are dropped, digits are
   Latin. */
(function () {
  function normalize(text) {
    return String(text || "")
      .replace(/[يى]/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[‌ـً-ٟ]/g, "")
      .replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 0x6f0; })
      .replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 0x660; })
      .toLowerCase();
  }

  function words(text) {
    return normalize(text).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  }

  function field(item, name) {
    var key = "_" + name;
    if (item[key] === undefined) item[key] = " " + words(item[name]).join(" ");
    return item[key];
  }

  /* Every query word must appear somewhere; title beats description beats text, and word starts beat the middle. */
  function search(index, query, limit) {
    var terms = words(query);
    if (!terms.length) return [];
    var found = [];
    for (var i = 0; i < index.length; i++) {
      var item = index[i];
      var score = 0;
      for (var t = 0; t < terms.length; t++) {
        var s = 0;
        var parts = [["title", 6], ["description", 3], ["text", 1]];
        for (var p = 0; p < parts.length; p++) {
          var haystack = field(item, parts[p][0]);
          if (haystack.indexOf(" " + terms[t]) >= 0) s += parts[p][1] * 2;
          else if (haystack.indexOf(terms[t]) >= 0) s += parts[p][1];
        }
        if (!s) { score = 0; break; }
        score += s;
      }
      if (score) found.push({ item: item, score: score });
    }
    found.sort(function (a, b) { return b.score - a.score; });
    return found.slice(0, limit || 8).map(function (r) { return r.item; });
  }

  function init() {
    var form = document.querySelector("[data-search]");
    if (!form || typeof fetch !== "function") return;
    var input = form.querySelector("input");
    var panel = form.querySelector(".sl-search-panel");
    var status = form.querySelector(".sl-search-status");
    var list = form.querySelector(".sl-search-results");
    var index = null;
    var loading = null;
    var persian = document.body.classList.contains("sl-fa-digits");

    function load() {
      if (!loading) {
        loading = fetch(form.getAttribute("data-search"))
          .then(function (r) { return r.json(); })
          .then(function (data) { index = data; form.hidden = false; return data; });
      }
      return loading;
    }

    function digits(n) {
      return persian ? String(n).replace(/\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".charAt(d); }) : String(n);
    }

    function show(results) {
      list.textContent = "";
      panel.hidden = !input.value.trim();
      if (panel.hidden) return;
      status.textContent = results.length ? form.getAttribute("data-count").replace("{n}", digits(results.length)) : form.getAttribute("data-none");
      results.forEach(function (item) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        var note = document.createElement("span");
        a.href = item.url;
        a.textContent = item.title;
        note.textContent = item.description || item.text.slice(0, 100);
        li.appendChild(a);
        li.appendChild(note);
        list.appendChild(li);
      });
    }

    function links() { return Array.prototype.slice.call(list.querySelectorAll("a")); }

    input.addEventListener("input", function () { show(index ? search(index, input.value) : []); });
    input.addEventListener("focus", function () { load().then(function () { show(search(index, input.value)); }, function () {}); });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var first = links()[0];
      if (first) location.href = first.href;
    });
    form.addEventListener("keydown", function (event) {
      var items = links();
      var at = items.indexOf(document.activeElement);
      if (event.key === "Escape") { panel.hidden = true; input.focus(); }
      else if (event.key === "ArrowDown" && items.length) { event.preventDefault(); items[Math.min(at + 1, items.length - 1)].focus(); }
      else if (event.key === "ArrowUp" && at >= 0) { event.preventDefault(); (items[at - 1] || input).focus(); }
    });
    document.addEventListener("click", function (event) { if (!form.contains(event.target)) panel.hidden = true; });
    load().then(function () {}, function () {});
  }

  globalThis.slipwaySearch = { normalize: normalize, search: search };
  if (typeof document !== "undefined" && document.querySelector) init();
})();
