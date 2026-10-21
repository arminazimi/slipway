/* Copy button for code blocks. Without JavaScript the blocks are plain and fully readable; this wraps
   each <pre> and adds a button. */
(function () {
  var LABELS = {
    en: { copy: "Copy", done: "Copied", fail: "Press Ctrl+C" },
    fa: { copy: "کپی", done: "کپی شد", fail: "Ctrl+C را بزنید" }
  };

  function label(lang, state) {
    var set = LABELS[String(lang || "en").slice(0, 2).toLowerCase()] || LABELS.en;
    return set[state];
  }

  function attach(pre, lang) {
    var wrap = document.createElement("div");
    var button = document.createElement("button");
    wrap.className = "sl-code";
    button.type = "button";
    button.className = "sl-copy";
    button.textContent = label(lang, "copy");
    button.addEventListener("click", function () {
      var text = pre.textContent;
      var write = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text) : Promise.reject();
      write.then(
        function () { button.textContent = label(lang, "done"); },
        function () { button.textContent = label(lang, "fail"); }
      );
      setTimeout(function () { button.textContent = label(lang, "copy"); }, 2000);
    });
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);
    wrap.appendChild(button);
  }

  function init() {
    var lang = document.documentElement.lang;
    var blocks = document.querySelectorAll("main pre");
    for (var i = 0; i < blocks.length; i++) attach(blocks[i], lang);
  }

  globalThis.slipwayCopy = { label: label };
  if (typeof document !== "undefined" && document.querySelectorAll) init();
})();
