module.exports = {
  extends: ["html-validate:recommended"],
  rules: {
    // Jekyll outputs trailing whitespace heavily by default.
    "no-trailing-whitespace": "off",
    // Jekyll outputs lowercase doctype by default, which is perfectly valid HTML5.
    "doctype-style": "off",
    "void-style": "off"
  }
};
