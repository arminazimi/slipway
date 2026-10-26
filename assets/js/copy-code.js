/* Copy button for code blocks. Without JavaScript the blocks are plain and fully readable; this wraps
   each <pre> and adds a button. */
(function () {
  var LABELS = {
    en: { copy: "Copy", done: "Copied", fail: "Press Ctrl+C" },
    fa: { copy: "کپی", done: "کپی شد", fail: "Ctrl+C را بزنید" }
  };

  var DATA = { copy: "copy", done: "copied", fail: "copyFailed" };

  /* Labels come from data attributes on <body> (set from _data/i18n); the built-in ones are the fallback. */
  function label(lang, state, data) {
    if (data && data[DATA[state]]) return data[DATA[state]];
    var set = LABELS[String(lang || "en").slice(0, 2).toLowerCase()] || LABELS.en;
    return set[state];
  }

  function a(b, lang, data, orig, act) {
    b.onclick = function () {
      var c = navigator.clipboard, w = c && c.writeText ? act(c) : Promise.reject();
      w.then(function(){b.textContent=label(lang,"done",data)},function(){b.textContent=label(lang,"fail",data)});
      setTimeout(function(){b.textContent=orig}, 2e3);
    };
  }

  function attach(pre, lang, data) {
    var w=document.createElement("div"), b=document.createElement("button"), o;
    w.className="sl-code"; b.type="button"; b.className="sl-copy";
    o = b.textContent = label(lang, "copy", data);
    a(b, lang, data, o, function(c){return c.writeText(pre.textContent)});
    pre.parentNode.insertBefore(w, pre); w.appendChild(pre); w.appendChild(b);
  }

  function init() {
    var d=document, l=d.documentElement.lang, a_=d.body&&d.body.dataset, p=d.querySelectorAll("main pre"), b=d.querySelector(".sl-copy-page");
    for (var i = 0; i < p.length; i++) attach(p[i], l, a_);
    if (b) {
      b.removeAttribute("hidden");
      a(b, l, a_, b.textContent, function(c){return fetch(b.dataset.copyPage).then(function(r){return r.text()}).then(function(v){return c.writeText(v)})});
    }
  }

  globalThis.slipwayCopy = { label: label };
  if (typeof document !== "undefined" && document.querySelectorAll) init();
})();
