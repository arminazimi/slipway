import { spawnSync } from 'node:child_process';
const result = spawnSync('npm', ['run', 'check'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(1);
