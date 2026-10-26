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

  function attach(pre, lang, data) {
    var wrap = document.createElement("div");
    var button = document.createElement("button");
    wrap.className = "sl-code";
    button.type = "button";
    button.className = "sl-copy";
    button.textContent = label(lang, "copy", data);
    button.addEventListener("click", function () {
      var text = pre.textContent;
      var write = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text) : Promise.reject();
      write.then(
        function () { button.textContent = label(lang, "done", data); },
        function () { button.textContent = label(lang, "fail", data); }
      );
      setTimeout(function () { button.textContent = label(lang, "copy", data); }, 2000);
    });
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    wrap.appendChild(button);
  }

  function init() {
    var lang = document.documentElement.lang;
    var data = document.body && document.body.dataset;
    var blocks = document.querySelectorAll("main pre");
    for (var i = 0; i < blocks.length; i++) attach(blocks[i], lang, data);
  }

  globalThis.slipwayCopy = { label: label };
  if (typeof document !== "undefined" && document.querySelectorAll) init();
})();
