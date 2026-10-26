import fs from 'fs';
const content = fs.readFileSync('CHANGELOG.md', 'utf8');
const newContent = content.replace(
  /<<<<<<< HEAD\n- `@slipway\/tokens` npm package exporting the theme's design tokens and core CSS\.\n=======\n- Added UI string files for ten languages \(#224\)\.\n>>>>>>> d38f70a \(Update CHANGELOG\.md\)/,
  "- Added UI string files for ten languages (#224).\n- `@slipway/tokens` npm package exporting the theme's design tokens and core CSS."
);
fs.writeFileSync('CHANGELOG.md', newContent);
