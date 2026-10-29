import { buildExample } from './tools/theme/build.mjs';
import { root } from './tools/theme/tokens.mjs';
import { join } from 'path';

buildExample('template', join(root, '.tmp/test-endpoint-out'), join(root, 'site'));
