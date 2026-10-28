import fs from 'fs';
const file = 'packages/doctor/src/checks.mjs';
let content = fs.readFileSync(file, 'utf8');

const importStatement = 'import * as c30 from "./checks/schema-coverage.mjs";\n';
content = content.replace('export const checks = {', importStatement + '\nexport const checks = {\n  [c30.id]: c30.run,');

fs.writeFileSync(file, content);
