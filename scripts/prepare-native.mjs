import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url);
const www = new URL('../www/', import.meta.url);
await rm(www, { recursive: true, force: true });
await mkdir(www, { recursive: true });

const files = [
  'index.html','app.js','styles.css','privacy.html','terms.html',
  'support.html','delete-account.html','service-worker.js'
];

for (const file of files) {
  const src = new URL('../' + file, import.meta.url);
  if (existsSync(src)) await cp(src, new URL('../www/' + file, import.meta.url));
}

const assets = new URL('../assets/', import.meta.url);
if (existsSync(assets)) await cp(assets, new URL('../www/assets/', import.meta.url), { recursive: true });

await build({
  entryPoints: [new URL('../native/bridge.ts', import.meta.url).pathname],
  outfile: new URL('../www/native-bridge.js', import.meta.url).pathname,
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020']
});

const indexPath = new URL('../www/index.html', import.meta.url);
let html = await readFile(indexPath, 'utf8');
if (!html.includes('native-bridge.js')) {
  html = html.replace('</head>', '<script defer src="./native-bridge.js"></script></head>');
}
html = html.replace(/<script>if\("serviceWorker" in navigator\)[\s\S]*?<\/script>/, '');
await writeFile(indexPath, html);
console.log('Prepared local native web bundle in www/');
