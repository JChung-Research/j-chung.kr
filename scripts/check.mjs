// npm run check = astro build, then this script. Verifies dist/:
//   1. every internal href/src/srcset (and meta-refresh target) resolves to a file, with the right base;
//      #fragments must exist on the target page;
//   2. the four CV-printed redirect pages exist with the right targets;
//   3. no em dash or en dash in visible text;
//   4. mode rules: preview = noindex on every page, Disallow robots, no sitemap; production = sitemap;
//      no CNAME anywhere;
//   5. the full-list pages behind the homepage highlights exist, are linked from the homepage and,
//      in production, are in the sitemap.
// Exit code 1 on any failure.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE, SITE, IS_PREVIEW, SITE_MODE } from '../astro.config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const BASE_PATH = BASE.endsWith('/') ? BASE : BASE + '/';
const SITE_ROOT = new URL(BASE_PATH, SITE).href; // e.g. https://j-chung.kr/

// The CV-printed URLs. Kept here on purpose as a second, independent copy of src/lib/redirects.ts.
const CV_REDIRECTS = {
  'ornl-profile': 'https://www.ornl.gov/staff-profile/jihoon-chung',
  'google-scholar': 'https://scholar.google.com/citations?user=ExZUcKYAAAAJ&hl=en',
  orcid: 'https://orcid.org/0000-0001-8488-0815',
  linkedin: 'https://www.linkedin.com/in/jihoon-chung/',
};

const failures = [];
const fail = (msg) => failures.push(msg);

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', ndash: '\u2013', mdash: '\u2014', middot: '\u00b7', copy: '\u00a9', larr: '\u2190', rarr: '\u2192' };
function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return NAMED[e.toLowerCase()] ?? m;
  });
}

if (!existsSync(DIST)) {
  console.error('dist/ not found. Run the build first (npm run check does both).');
  process.exit(1);
}
const files = walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const rel = (f) => relative(DIST, f).split('\\').join('/');

// ids per page, for fragment checks
const idCache = new Map();
function idsOf(file) {
  if (!idCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\sid=(?:"([^"]*)"|'([^']*)')/g)].map((m) => m[1] ?? m[2])));
  }
  return idCache.get(file);
}

/** Map a site path ("/j-chung.kr/research/") to a dist file, or null. */
function resolvePath(pathname) {
  let p = decodeURIComponent(pathname);
  if (!p.startsWith(BASE_PATH)) return { error: `not under base ${BASE_PATH}` };
  p = p.slice(BASE_PATH.length);
  const target = join(DIST, p);
  if (p === '' || p.endsWith('/')) {
    const idx = join(target, 'index.html');
    return existsSync(idx) ? { file: idx } : { error: 'no index.html' };
  }
  if (existsSync(target) && statSync(target).isFile()) return { file: target };
  if (existsSync(join(target, 'index.html'))) return { error: 'missing trailing slash' };
  return { error: 'file not found' };
}

let linkCount = 0;
function checkRef(page, raw, what) {
  const ref = decode(raw.trim());
  if (!ref || /^(mailto:|tel:|data:|javascript:)/i.test(ref)) return;
  let url;
  if (/^https?:\/\//i.test(ref) || ref.startsWith('//')) {
    const abs = ref.startsWith('//') ? 'https:' + ref : ref;
    if (!abs.startsWith(SITE_ROOT)) return; // external
    url = new URL(abs);
  } else {
    if (ref.startsWith('#')) {
      const id = ref.slice(1);
      if (id && !idsOf(page).has(decodeURIComponent(id))) fail(`${rel(page)}: ${what} "${ref}" has no matching id on the page`);
      linkCount++;
      return;
    }
    if (!ref.startsWith('/')) {
      fail(`${rel(page)}: ${what} "${ref}" is relative; use the base-aware url() helper`);
      return;
    }
    url = new URL(ref, 'https://example.invalid/');
  }
  linkCount++;
  const r = resolvePath(url.pathname);
  if (r.error) {
    fail(`${rel(page)}: ${what} "${ref}" -> ${r.error}`);
    return;
  }
  const frag = url.hash.slice(1);
  if (frag && r.file.endsWith('.html') && !idsOf(r.file).has(decodeURIComponent(frag))) {
    fail(`${rel(page)}: ${what} "${ref}" -> #${frag} not found in ${rel(r.file)}`);
  }
}

// ---------- 1. links ----------
for (const page of htmlFiles) {
  const html = readFileSync(page, 'utf8');
  for (const m of html.matchAll(/<[a-z][^>]*>/gi)) {
    const tag = m[0];
    for (const a of tag.matchAll(/\s(href|src|srcset)=(?:"([^"]*)"|'([^']*)')/gi)) {
      const name = a[1].toLowerCase();
      const value = a[2] ?? a[3];
      if (name === 'srcset') value.split(',').forEach((part) => checkRef(page, part.trim().split(/\s+/)[0], 'srcset'));
      else checkRef(page, value, name);
    }
    const refresh = tag.match(/http-equiv=["']refresh["'][^>]*content=["'][^;]*;\s*url=([^"']+)["']/i);
    if (refresh) checkRef(page, refresh[1], 'meta refresh');
    if (/property=["']og:image["']/.test(tag)) {
      const c = tag.match(/content=["']([^"']+)["']/);
      if (c) checkRef(page, c[1], 'og:image');
    }
  }
}
// web manifest icons
for (const f of files.filter((f) => f.endsWith('.webmanifest'))) {
  const manifest = JSON.parse(readFileSync(f, 'utf8'));
  for (const icon of manifest.icons ?? []) {
    if (!existsSync(join(dirname(f), icon.src))) fail(`${rel(f)}: icon ${icon.src} not found`);
  }
}

// ---------- 2. CV-printed redirects ----------
for (const [path, target] of Object.entries(CV_REDIRECTS)) {
  const file = join(DIST, path, 'index.html');
  if (!existsSync(file)) {
    fail(`CV redirect /${path}/ is missing`);
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const refresh = html.match(/http-equiv=["']refresh["'][^>]*content=["']0;\s*url=([^"']+)["']/i);
  if (!refresh || decode(refresh[1]) !== target) fail(`CV redirect /${path}/: meta refresh target is ${refresh ? decode(refresh[1]) : 'missing'}, expected ${target}`);
  if (!html.includes(`location.replace(${JSON.stringify(target)})`)) fail(`CV redirect /${path}/: location.replace("${target}") missing`);
  const links = [...html.matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi)].map((m) => decode(m[1]));
  if (!links.includes(target)) fail(`CV redirect /${path}/: visible link to ${target} missing`);
}

// ---------- 3. em and en dashes in visible text ----------
for (const page of htmlFiles) {
  const html = readFileSync(page, 'utf8')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const attrs = [...html.matchAll(/\s(?:alt|title|aria-label|placeholder)=(?:"([^"]*)"|'([^']*)')/gi)].map((m) => m[1] ?? m[2]);
  const metas = [...html.matchAll(/<meta\s[^>]*(?:name|property)=["'](?:description|og:title|og:description|og:image:alt)["'][^>]*>/gi)]
    .map((m) => (m[0].match(/content=["']([^"']*)["']/) || [])[1] || '');
  const visible = [html.replace(/<[^>]+>/g, ' '), ...attrs, ...metas].map(decode).join('\n');
  const hits = [...visible.matchAll(/.{0,30}[\u2013\u2014].{0,30}/g)].map((m) => m[0].replace(/\s+/g, ' '));
  if (hits.length) {
    hits.forEach((h) => fail(`${rel(page)}: em/en dash in visible text: "${h}"`));
  }
}

// ---------- 4. mode rules ----------
if (files.some((f) => /(^|[\\/])CNAME$/.test(f)) || existsSync(join(ROOT, 'public', 'CNAME'))) fail('CNAME file found; the custom domain is attached at cutover, not in the repo');
const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
if (IS_PREVIEW) {
  if (!/Disallow:\s*\/\s*$/m.test(robots)) fail('preview: robots.txt must Disallow: /');
  if (existsSync(join(DIST, 'sitemap-index.xml'))) fail('preview: sitemap must not be generated');
  for (const page of htmlFiles) {
    if (!/<meta name="robots" content="noindex, nofollow">/.test(readFileSync(page, 'utf8'))) fail(`preview: ${rel(page)} lacks noindex, nofollow`);
  }
} else {
  if (!existsSync(join(DIST, 'sitemap-index.xml'))) fail('production: sitemap-index.xml missing');
  if (!robots.includes(`Sitemap: ${SITE_ROOT}sitemap-index.xml`)) fail('production: robots.txt does not point to the sitemap');
}

// ---------- 5. full-list pages linked from the homepage highlights ----------
const HOME_LIST_PAGES = ['news/', 'software/', 'design/', 'publications/'];
const homeFile = join(DIST, 'index.html');
const homeHrefs = existsSync(homeFile)
  ? new Set([...readFileSync(homeFile, 'utf8').matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi)].map((m) => decode(m[1])))
  : new Set();
const sitemapXml = walk(DIST).filter((f) => /sitemap-\d+\.xml$/.test(f)).map((f) => readFileSync(f, 'utf8')).join('\n');
for (const page of HOME_LIST_PAGES) {
  linkCount++;
  if (!existsSync(join(DIST, page, 'index.html'))) fail(`/${page} is missing`);
  if (!homeHrefs.has(BASE_PATH + page)) fail(`homepage does not link to ${BASE_PATH}${page}`);
  if (!IS_PREVIEW && !sitemapXml.includes(`<loc>${SITE_ROOT}${page}</loc>`)) fail(`production: sitemap does not list ${SITE_ROOT}${page}`);
}

// ---------- report ----------
console.log(`check (${SITE_MODE}, base ${BASE_PATH}): ${htmlFiles.length} pages, ${linkCount} internal links and assets checked, ${Object.keys(CV_REDIRECTS).length} CV redirects checked, dash scan on ${htmlFiles.length} pages.`);
if (failures.length) {
  console.error(`\n${failures.length} problem(s):`);
  failures.forEach((f) => console.error('  - ' + f));
  process.exit(1);
}
console.log('All checks passed.');
