# Built-in UI Strings

To add a new language to Slipway:

1. Create `_includes/i18n/<lang>.html` with the translated UI strings, using one of the existing files (like `en.html`) as a template.
2. If the language needs custom font or typography styles, you can optionally provide `assets/css/lang/<lang>.css`. This will be included automatically.
3. Write tests to verify the language works correctly.
