(function () {
  var LABELS = {
    en: { copy: "Copy", done: "Copied", fail: "Press Ctrl+C" },
    fa: { copy: "کپی", done: "کپی شد", fail: "Ctrl+C را بزنید" }
  };

  var DATA = { copy: "copy", done: "copied", fail: "copyFailed" };

  function label(lang, state, data) {
    if (data && data[DATA[state]]) return data[DATA[state]];
    var set = LABELS[String(lang || "en").slice(0, 2).toLowerCase()] || LABELS.en;
    return set[state];
  }

  function bind(btn, lang, data, orig, act) {
    btn.onclick = function() {
      var clip = navigator.clipboard;
      var p = clip && clip.writeText ? act(clip) : Promise.reject();
      p.then(
        function() { btn.textContent = label(lang, "done", data); },
        function() { btn.textContent = label(lang, "fail", data); }
      );
      setTimeout(function() { btn.textContent = orig; }, 2e3);
    };
  }

  function attach(pre, lang, data) {
    var doc = document, wrap = doc.createElement("div"), btn = doc.createElement("button");
    wrap.className = "sl-code";
    btn.type = "button";
    btn.className = "sl-copy";
    var orig = btn.textContent = label(lang, "copy", data);
    bind(btn, lang, data, orig, function(c) { var m=pre.querySelector(".sl-commands");return c.writeText(m?m.textContent:pre.textContent) });
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    wrap.appendChild(btn);
  }

  function init() {
    var doc = document, lang = doc.documentElement.lang, data = doc.body && doc.body.dataset;
    var pre = doc.querySelectorAll("main pre"), btn = doc.querySelector(".sl-copy-page");
    for (var i = 0; i < pre.length; i++) attach(pre[i], lang, data);
    if (btn) {
      btn.removeAttribute("hidden");
      bind(btn, lang, data, btn.textContent, function(c) {
        return fetch(btn.dataset.copyPage).then(function(r) { return r.text(); }).then(function(t) { return c.writeText(t); });
      });
    }
  }

  globalThis.slipwayCopy = { label: label };
  if (typeof document !== "undefined" && document.querySelectorAll) init();
})();
