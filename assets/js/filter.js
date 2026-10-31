/* Narrows a table or list to the rows that match a filter field. The field is hidden in the markup and
   shown here, so without JavaScript every row stays visible. Matching reuses search.js normalization
   (case, diacritics, Persian letter variants, digits); pages without search.js fall back to lower case. */
(function () {
  function normalize(text) {
    var value = globalThis.slipwaySearch ? slipwaySearch.normalize(String(text || "")) : String(text || "").toLowerCase();
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function match(text, query) {
    var needle = normalize(String(query || "").trim());
    return !needle || normalize(text).indexOf(needle) > -1;
  }

  function rows(list) {
    return list.tagName === "TABLE" ? list.tBodies[0].rows : list.children;
  }

  function init(field) {
    var input = field.querySelector("input");
    var selector = field.getAttribute("data-filter-target");
    var list = selector ? document.querySelector(selector) : field.nextElementSibling;
    if (!input || !list) return;
    var status = field.querySelector(".sl-filter-status");
    var items = rows(list);
    list.setAttribute("data-filtered", "");

    function apply() {
      var query = input.value.trim();
      var shown = 0;
      Array.prototype.forEach.call(items, function (row) {
        var hit = match(row.textContent, query);
        row.hidden = !hit;
        if (hit) shown += 1;
      });
      if (status) {
        status.textContent = query ? (shown ? input.getAttribute("data-filter-count").replace("{n}", shown) : input.getAttribute("data-filter-none")) : "";
      }
    }

    input.addEventListener("input", apply);
    input.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        input.value = "";
        apply();
      }
    });
    field.hidden = false;
  }

  globalThis.slipwayFilter = { match: match, normalize: normalize };
  if (typeof document !== "undefined" && document.querySelectorAll) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-filter]"), init);
  }
})();
