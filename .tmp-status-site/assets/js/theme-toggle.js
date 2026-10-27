/* Theme toggle: auto (system) -> light -> dark. The choice is kept in localStorage and applied as
   data-theme on <html> (see _includes/theme-init.html, which applies it before first paint). */
(function () {
  var KEY = "slipway-theme";
  var MODES = ["auto", "light", "dark"];

  function resolveMode(stored) {
    return stored === "light" || stored === "dark" ? stored : "auto";
  }

  function nextMode(mode) {
    return MODES[(MODES.indexOf(mode) + 1) % MODES.length];
  }

  function read() {
    try {
      return resolveMode(localStorage.getItem(KEY));
    } catch (e) {
      return "auto";
    }
  }

  function write(mode) {
    try {
      if (mode === "auto") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, mode);
    } catch (e) {}
  }

  function apply(mode) {
    var root = document.documentElement;
    if (mode === "auto") delete root.dataset.theme;
    else root.dataset.theme = mode;
  }

  function change(mode) {
    var reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof document.startViewTransition === "function" && !reduced) document.startViewTransition(function () { apply(mode); });
    else apply(mode);
  }

  function init() {
    var mode = read();
    var buttons = document.querySelectorAll("[data-theme-toggle]");
    function label() {
      var fallback = mode.charAt(0).toUpperCase() + mode.slice(1);
      for (var i = 0; i < buttons.length; i++) {
        var data = buttons[i].dataset;
        buttons[i].textContent = (data && data["label" + fallback]) || fallback;
      }
    }
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].hidden = false;
      buttons[i].addEventListener("click", function () {
        mode = nextMode(mode);
        write(mode);
        change(mode);
        label();
      });
    }
    label();
  }

  globalThis.slipwayTheme = { resolveMode: resolveMode, nextMode: nextMode };
  if (typeof document !== "undefined") init();
})();
