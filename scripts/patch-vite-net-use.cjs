/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const viteChunkPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'vite',
  'dist',
  'node',
  'chunks',
  'node.js'
);

function patch() {
  if (!fs.existsSync(viteChunkPath)) {
    console.log(`[patch-vite] skip: not found: ${viteChunkPath}`);
    return;
  }

  const src = fs.readFileSync(viteChunkPath, 'utf8');
  if (src.includes('In restricted environments, spawning `net` can throw EPERM.')) {
    console.log('[patch-vite] ok: already patched');
    return;
  }

  const needle =
    'exec("net use", (error, stdout) => {\n' +
    '\t\tif (error) return;\n' +
    '\t\tconst lines = stdout.split("\\n");\n';

  const replacement =
    'try {\n' +
    '\t\texec("net use", (error, stdout) => {\n' +
    '\t\t\tif (error) return;\n' +
    '\t\t\tconst lines = stdout.split("\\n");\n';

  if (!src.includes(needle)) {
    console.log('[patch-vite] skip: expected snippet not found (vite may have changed)');
    return;
  }

  let out = src.replace(needle, replacement);

  const tailNeedle = '\t});\n}\nfunction ensureWatchedFile';
  const tailReplacement =
    '\t\t});\n' +
    '\t} catch {\n' +
    '\t\t// In restricted environments, spawning `net` can throw EPERM.\n' +
    '\t\t// Ignore and fall back to the default realpath implementation.\n' +
    '\t}\n' +
    '}\n' +
    'function ensureWatchedFile';

  if (!out.includes(tailNeedle)) {
    console.log('[patch-vite] skip: could not locate function tail (vite may have changed)');
    return;
  }

  out = out.replace(tailNeedle, tailReplacement);
  fs.writeFileSync(viteChunkPath, out, 'utf8');
  console.log('[patch-vite] patched vite safeRealPathSync net-use spawn');
}

try {
  patch();
} catch (err) {
  console.log('[patch-vite] failed:', err && err.message ? err.message : err);
}

