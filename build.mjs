// Production build: minify app.js and style.css, content-hash them into /assets,
// rewrite page references, copy static files to dist/.
// console.log/info/debug calls are removed; console.error/warn are kept so
// failures on payment and access paths stay diagnosable.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const SKIP = new Set(['node_modules', 'dist', 'scripts', 'supabase', '.git', 'package.json', 'package-lock.json', 'README.md', 'DEPLOYMENT.md', 'app.js', 'style.css']);

rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'assets'), { recursive: true });

for (const name of readdirSync(ROOT)) {
  if (SKIP.has(name)) continue;
  cpSync(join(ROOT, name), join(DIST, name), { recursive: true });
}

const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);

async function emit(entry, ext, loader) {
  const out = await build({
    entryPoints: [entry], bundle: false, minify: true, write: false, legalComments: 'none',
    loader: { [ext]: loader }, target: 'es2019',
    pure: ext === '.js' ? ['console.log', 'console.info', 'console.debug'] : [],
  });
  const code = out.outputFiles[0].contents;
  const file = `${entry.replace(ext, '')}.${hash(code)}${ext}`;
  writeFileSync(join(DIST, 'assets', file), code);
  console.log(`${entry}: ${statSync(entry).size} -> ${code.length} bytes (${file})`);
  return '/assets/' + file;
}

const appUrl = await emit('app.js', '.js', 'js');
const cssUrl = await emit('style.css', '.css', 'css');

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });
}
for (const f of walk(DIST)) {
  let h = readFileSync(f, 'utf8');
  const o = h;
  h = h.replace(/(["'])\/?app\.js(\?v=\d+)?\1/g, `$1${appUrl}$1`).replace(/(["'])\/?style\.css(\?v=\d+)?\1/g, `$1${cssUrl}$1`);
  if (h !== o) writeFileSync(f, h);
}
console.log('Build complete: dist/');
