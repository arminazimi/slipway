import fs from 'fs';
const file = 'packages/doctor/test/doctor.test.mjs';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('["unknown-config", "unknown-front-matter", "doctor.twin-fresh", "doctor.schema-coverage"]', '["doctor.schema-coverage", "unknown-config", "unknown-front-matter", "doctor.twin-fresh"]');

fs.writeFileSync(file, content);
