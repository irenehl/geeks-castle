import { cpSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const swaggerDist = dirname(require.resolve('swagger-ui-dist/package.json'));
const dest = join(
  fileURLToPath(new URL('..', import.meta.url)),
  'public',
  'swagger-ui',
);

mkdirSync(dest, { recursive: true });

for (const file of [
  'swagger-ui.css',
  'swagger-ui-bundle.js',
  'swagger-ui-standalone-preset.js',
  'favicon-32x32.png',
  'favicon-16x16.png',
]) {
  cpSync(join(swaggerDist, file), join(dest, file));
}

console.log(`Swagger UI assets copied to ${dest}`);
