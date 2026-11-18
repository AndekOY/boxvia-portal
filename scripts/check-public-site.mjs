#!/usr/bin/env node
// Static checks for BoxVia public site. Run: node scripts/check-public-site.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  '/', '/services/', '/faar/', '/services/technical-pilot/',
  '/services/one-question-review/', '/services/ai-governance-review/',
  '/services/pre-decision-review/', '/services/ai-governance-gap-assessment/',
  '/for-business/', '/for-developers/', '/for-creators/', '/for-researchers/',
  '/reports/', '/research/', '/andeks/', '/legal/', '/privacy/', '/contact/'
];
const failures = [];
const warnings = [];
const toFile = route => path.join(root, route.replace(/^\//, ''), 'index.html');
const exists = route => fs.existsSync(toFile(route));
const ignore = new Set(['/api/', '/assets/']);
const scan = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => {
  if (e.name === '.git' || e.name === 'node_modules' || e.name === '.wrangler') return [];
  const full = path.join(dir,e.name);
  return e.isDirectory() ? scan(full) : e.isFile() && full.endsWith('.html') ? [full] : [];
});
for (const route of required) if (!exists(route)) failures.push('Missing required route: ' + route);
for (const file of scan(root)) {
  const rel = path.relative(root,file).replaceAll('\\','/');
  const html = fs.readFileSync(file,'utf8');
  if (/[—–]/.test(html)) failures.push('Long dash in public HTML: ' + rel);
  if (!/<html\b[^>]*lang="en"/i.test(html)) warnings.push('Check HTML language: ' + rel);
  if (!/rel="canonical"/.test(html)) warnings.push('No canonical: ' + rel);
  for (const m of html.matchAll(/\bhref="(\/[^"#?]*)/g)) {
    const url = m[1];
    if ([...ignore].some(prefix => url.startsWith(prefix))) continue;
    if (url === '/' || url.endsWith('/')) {
      if (!exists(url)) failures.push('Broken internal link: ' + rel + ' -> ' + url);
    } else if (!fs.existsSync(path.join(root,url.slice(1)))) {
      warnings.push('Check internal file link: ' + rel + ' -> ' + url);
    }
  }
  if (/<form\b/.test(html) && !/action="\/api\/service-request"|action="\/api\/claim"/.test(html))
    warnings.push('Check form action: ' + rel);
}
const sitemap = path.join(root,'sitemap.xml');
if (!fs.existsSync(sitemap)) failures.push('Missing sitemap.xml');
else {
  const xml = fs.readFileSync(sitemap,'utf8');
  for (const route of required) if (!xml.includes('https://boxvia.andeks.workers.dev' + route))
    warnings.push('Not listed in sitemap: ' + route);
}
for (const issue of [...new Set(failures)]) console.error('FAIL',issue);
for (const issue of [...new Set(warnings)]) console.warn('WARN',issue);
console.log('Public-site checks:', failures.length, 'failures,', warnings.length, 'warnings');
process.exitCode = failures.length ? 1 : 0;
