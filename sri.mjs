// Adds or refreshes integrity="sha384-..." on every jsDelivr script tag in index.html.
// Run once with network access, review the diff, commit.  Usage: npm run sri
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'index.html';
let html = readFileSync(file, 'utf8');
const tags = html.match(/<script\b[^>]*src="https:\/\/cdn\.jsdelivr\.net[^"]+"[^>]*><\/script>/g) || [];
for (const tag of tags) {
  const url = tag.match(/src="([^"]+)"/)[1];
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  const digest = createHash('sha384').update(Buffer.from(await res.arrayBuffer())).digest('base64');
  let next = tag.replace(/\sintegrity="[^"]*"/, '');
  next = next.replace('<script ', `<script integrity="sha384-${digest}" `);
  if (!/crossorigin=/.test(next)) next = next.replace('<script ', '<script crossorigin="anonymous" ');
  html = html.replace(tag, next);
  console.log('SRI', url);
}
writeFileSync(file, html);
