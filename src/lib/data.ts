// Loads and validates src/data/*.yml at build time. A typo in a data file stops the build
// with a message naming the file and the field, instead of publishing a broken page.
import { parse } from 'yaml';
import { z } from 'astro/zod';

import profileRaw from '../data/profile.yml?raw';
import educationRaw from '../data/education.yml?raw';
import newsRaw from '../data/news.yml?raw';
import publicationsRaw from '../data/publications.yml?raw';
import projectsRaw from '../data/projects.yml?raw';
import recentRaw from '../data/recent.yml?raw';
import softwareRaw from '../data/software.yml?raw';
import themesRaw from '../data/themes.yml?raw';
import talksRaw from '../data/talks.yml?raw';
import teachingRaw from '../data/teaching.yml?raw';
import serviceRaw from '../data/service.yml?raw';
import videosRaw from '../data/videos.yml?raw';

const ym = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'use YYYY-MM in quotes, e.g. "2026-09"');
const ymd = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'use YYYY-MM-DD in quotes');
const opt = <T extends z.ZodTypeAny>(t: T) => t.nullish().transform((v) => v ?? undefined);
const str = z.string().min(1);
const text = z.string().min(1).transform((s) => s.replace(/\s+/g, ' ').trim());
const THEME_SLUGS = ['interoperable-digital-twins', 'grid-interactive-efficient-buildings', 'human-building-interaction'] as const;
const themeSlug = z.enum(THEME_SLUGS);

const Profile = z.object({
  name: str,
  suffix: str,
  citation_name: str,
  headline: z.array(str).min(1),
  role: z.object({ title: str, group: str, organization: str, since: ym }),
  bio: text,
  description: text,
  email: z.string().email(),
  contact_form: z.object({ provider: z.literal('formspree'), key: opt(str) }),
  headshot: str,
  headshot_width: z.number().int(),
  headshot_height: z.number().int(),
  headshot_alt: str,
  credentials: z.array(z.object({ name: str, issuer: str, year: z.number().int() })),
  links: z.object({
    scholar: z.string().url(),
    orcid: z.string().url(),
    orcid_id: str,
    linkedin: z.string().url(),
    github: z.string().url(),
    github_handle: str,
    ornl: z.string().url(),
    instagram: z.string().url(),
    instagram_handle: str,
  }),
});

const Education = z.array(
  z.object({
    degree: str,
    field: str,
    school: str,
    year: z.number().int(),
    abbr: opt(z.record(z.string(), str)),
  }),
);

const News = z.array(
  z.object({
    date: ym,
    text: text,
    link: opt(z.object({ url: z.string().url(), label: str })),
  }),
);

const Publications = z.array(
  z.object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and hyphens only'),
    type: z.enum(['journal', 'conference', 'report']),
    title: text,
    authors: z.array(str).min(1),
    venue: str,
    place: opt(str),
    publisher: opt(str),
    year: z.number().int(),
    month: opt(z.number().int().min(1).max(12)),
    volume: opt(z.union([z.number(), str])),
    issue: opt(z.union([z.number(), str])),
    pages: opt(z.union([z.number(), str]).transform(String)),
    number: opt(z.union([z.number(), str])),
    doi: opt(str),
    pdf: opt(z.string().url()),
    code: opt(z.string().url()),
    bibtex: str,
    short: str,
    themes: z.array(themeSlug).default([]),
    selected: z.boolean().default(false),
  }),
);

const Projects = z.array(
  z.object({
    title: text,
    sponsor: str,
    start: ym,
    end: opt(ym),
    role: str,
    report_doi: opt(str),
    theme: themeSlug,
  }),
);

const yOrYm = z.string().regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, 'use YYYY or YYYY-MM in quotes, e.g. "2024" or "2026-09"');

const Recent = z.array(
  z.object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and hyphens only'),
    title: text,
    start: yOrYm,
    end: opt(yOrYm),
    host: str,
    sponsor: opt(str),
    line: text,
    diagram: z.enum(['orbit', 'medical', 'obxml', 'ifcjson']),
    paper: opt(str),
    report: opt(str),
    code: opt(str),
    video: opt(str),
    theme: themeSlug,
  }),
);

const Videos = z.array(
  z.object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and hyphens only'),
    youtube: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'the 11-character YouTube video ID'),
    title: text,
    short: str,
    length: z.string().regex(/^\d{1,2}:\d{2}$/, 'use M:SS in quotes, e.g. "2:05"'),
    date: ym,
    line: text,
    theme: themeSlug,
  }),
);

const Software = z.array(
  z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: str,
    full_name: opt(str),
    description: text,
    language: str,
    stack: z.array(str).default([]),
    repo: z.string().url(),
    license: opt(str),
    theme: themeSlug,
    credit: opt(text),
    features: z.array(z.object({ label: str, text: text })).default([]),
  }),
);

const Themes = z.array(
  z.object({
    slug: themeSlug,
    title: str,
    sentence: text,
    card: text,
    summary: text,
    papers: z.array(str).default([]),
    code: z.array(str).default([]),
    diagram: z.enum(['idt', 'geb', 'hbi']),
  }),
);

const Talks = z.array(
  z.object({
    date: ymd,
    title: text,
    event: str,
    organizer: opt(str),
    place: opt(str),
    kind: z.enum(['talk', 'invited', 'poster', 'panel', 'workshop']).default('talk'),
    link: opt(z.string().url()),
    themes: z.array(themeSlug).default([]),
  }),
);

const Teaching = z.array(
  z.object({
    role: str,
    title: str,
    code: opt(str),
    institution: str,
    start: ym,
    end: opt(ym),
    note: opt(text),
  }),
);

const Service = z.array(
  z.object({
    role: str,
    organization: str,
    event: opt(str),
    start: z.string().regex(/^\d{4}(-\d{2})?$/),
    end: opt(z.string().regex(/^\d{4}(-\d{2})?$/)),
    note: opt(text),
  }),
);

function load<T extends z.ZodTypeAny>(file: string, raw: string, schema: T): z.output<T> {
  const parsed = parse(raw) ?? [];
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`src/data/${file} is not valid:\n${issues}`);
  }
  return result.data;
}

export const profile = load('profile.yml', profileRaw, Profile);
export const education = load('education.yml', educationRaw, Education);
export const news = load('news.yml', newsRaw, News);
export const publications = load('publications.yml', publicationsRaw, Publications);
export const projects = load('projects.yml', projectsRaw, Projects);
export const recent = load('recent.yml', recentRaw, Recent);
export const software = load('software.yml', softwareRaw, Software);
export const themes = load('themes.yml', themesRaw, Themes);
export const talks = load('talks.yml', talksRaw, Talks);
export const teaching = load('teaching.yml', teachingRaw, Teaching);
export const service = load('service.yml', serviceRaw, Service);
export const videos = load('videos.yml', videosRaw, Videos);
export const videoById = (id: string) => videos.find((v) => v.id === id)!;

export type Publication = (typeof publications)[number];
export type Theme = (typeof themes)[number];

// Cross-file checks: ids that other files point to must exist.
{
  const pubIds = new Set(publications.map((p) => p.id));
  const swIds = new Set(software.map((s) => s.id));
  const dois = new Set(publications.map((p) => p.doi).filter(Boolean));
  const dup = publications.map((p) => p.id).filter((id, i, a) => a.indexOf(id) !== i);
  if (dup.length) throw new Error(`publications.yml: duplicate id ${dup.join(', ')}`);
  for (const t of themes) {
    // "sentence" (the /research/ cards) is the first sentence of "summary"; keep them in step.
    if (!t.summary.startsWith(t.sentence)) throw new Error(`themes.yml (${t.slug}): "summary" must start with "sentence"`);
    for (const id of t.papers) if (!pubIds.has(id)) throw new Error(`themes.yml (${t.slug}): unknown paper id "${id}"`);
    for (const id of t.code) if (!swIds.has(id)) throw new Error(`themes.yml (${t.slug}): unknown software id "${id}"`);
  }
  const recentDup = recent.map((r) => r.id).filter((id, i, a) => a.indexOf(id) !== i);
  if (recentDup.length) throw new Error(`recent.yml: duplicate id ${recentDup.join(', ')}`);
  for (const r of recent) {
    for (const key of ['paper', 'report'] as const) {
      const id = r[key];
      if (id && !pubIds.has(id)) throw new Error(`recent.yml (${r.id}): unknown ${key} id "${id}"`);
    }
    if (r.code && !swIds.has(r.code)) throw new Error(`recent.yml (${r.id}): unknown software id "${r.code}"`);
    if (r.video && !videos.some((v) => v.id === r.video)) throw new Error(`recent.yml (${r.id}): unknown video id "${r.video}"`);
  }
  for (const p of projects) {
    if (p.report_doi && !dois.has(p.report_doi)) {
      throw new Error(`projects.yml: report_doi ${p.report_doi} is not in publications.yml`);
    }
  }
}

// ---------- Formatting helpers ----------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09" -> "Sep 2026" */
export function formatYm(value: string): string {
  const [y, m] = value.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** "2026-05-13" -> "May 13, 2026" */
export function formatYmd(value: string): string {
  const [y, m, d] = value.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function pubDate(p: Publication, withMonth: boolean): string {
  return withMonth && p.month ? `${MONTHS[p.month - 1]} ${p.year}` : String(p.year);
}

/** Newest first; stable, so entries with the same date keep their file order. */
export function sortPublications(list: Publication[]): Publication[] {
  return list
    .map((p, i) => ({ p, i }))
    .sort((a, b) => b.p.year - a.p.year || (b.p.month ?? 0) - (a.p.month ?? 0) || a.i - b.i)
    .map((x) => x.p);
}

export function sortByDateDesc<T extends { date: string }>(list: T[]): T[] {
  return list
    .map((x, i) => ({ x, i }))
    .sort((a, b) => (a.x.date < b.x.date ? 1 : a.x.date > b.x.date ? -1 : a.i - b.i))
    .map((v) => v.x);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Inline text with links: [label](url). A label written in brackets, [[DOI]](url),
 * renders as the small bracketed reference style used across the site.
 */
export function inlineHtml(s: string): string {
  return escapeHtml(s).replace(/\[((?:\[[^\]]*\]|[^\[\]])+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
    const isRef = /^\[.*\]$/.test(label);
    return `<a${isRef ? ' class="ref"' : ''} href="${href}">${label}</a>`;
  });
}

/** Author list in citation style; the site owner's name in bold, non-breaking space inside each name. */
export function authorsHtml(authors: string[]): string {
  const fmt = (a: string) => {
    const html = escapeHtml(a).replace(/, /g, ',&nbsp;').replace(/\. (?=[A-Z]\.)/g, '.&nbsp;');
    return a === profile.citation_name ? `<b>${html}</b>` : html;
  };
  const etAl = authors[authors.length - 1] === 'et al.';
  const names = (etAl ? authors.slice(0, -1) : authors).map(fmt);
  if (etAl) return `${names.join(', ')}, et&nbsp;al.`;
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

/** Venue line: italic venue (with place or publisher), then volume(issue), pages or article number. */
export function venueHtml(p: Publication): string {
  const where = p.place ?? p.publisher;
  const vol = p.volume !== undefined ? `${p.volume}${p.issue !== undefined ? `(${p.issue})` : ''}` : undefined;
  const pages = p.pages ? (p.type === 'journal' ? p.pages : `pp. ${p.pages}`) : undefined;
  const tail = [vol, pages, p.number !== undefined ? String(p.number) : undefined].filter(Boolean) as string[];
  if (p.type === 'journal') {
    const head = `<i>${escapeHtml(p.venue)}</i>${where ? `, ${escapeHtml(where)}` : ''}`;
    return tail.length ? `${head}, ${tail.map(escapeHtml).join(', ')}.` : `${head}.`;
  }
  const head = `${escapeHtml(p.venue)}${where ? `, ${escapeHtml(where)}` : ''}`;
  return tail.length ? `<i>${head}</i>, ${tail.map(escapeHtml).join(', ')}.` : `<i>${head}.</i>`;
}

/** Accessible name used in "[DOI]" / "[PDF]" link labels. */
export function pubLabel(p: Publication): string {
  return p.type === 'report' ? p.short : `the ${p.short} paper`;
}

export function pubById(id: string): Publication {
  const p = publications.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown publication id "${id}"`);
  return p;
}

export function pubByDoi(doi: string): Publication | undefined {
  return publications.find((x) => x.doi === doi);
}

export function softwareById(id: string) {
  const s = software.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown software id "${id}"`);
  return s;
}

/** "May 2025 to present" */
export function spanYm(start: string, end?: string): string {
  return `${formatYm(start)} to ${end ? formatYm(end) : 'present'}`;
}

/** "May 2025 to present", "2022 to 2024": start and end as YYYY-MM or YYYY. */
export function spanPeriod(start: string, end?: string): string {
  const fmt = (v: string) => (v.length === 4 ? v : formatYm(v));
  return `${fmt(start)} to ${end ? fmt(end) : 'present'}`;
}

/** Repository "owner/name" from a GitHub URL. */
export function repoSlug(href: string): string {
  return href.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
}

export function themeBySlug(slug: string): Theme {
  const t = themes.find((x) => x.slug === slug);
  if (!t) throw new Error(`Unknown theme "${slug}"`);
  return t;
}

/** Venue line with its [DOI], [PDF] and [Code] links. "full" adds the PDF and code links (theme pages). */
export function pubLinksHtml(p: Publication, full: boolean): string {
  const label = escapeHtml(pubLabel(p));
  const links: string[] = [];
  if (p.doi) links.push(`<a class="doi" href="https://doi.org/${escapeHtml(p.doi)}" aria-label="DOI for ${label}">[DOI]</a>`);
  if (full && p.pdf) links.push(`<a class="doi" href="${escapeHtml(p.pdf)}" aria-label="PDF of ${label}">[PDF]</a>`);
  if (full && p.code) links.push(`<a class="doi" href="${escapeHtml(p.code)}" aria-label="Code for ${label}">[Code]</a>`);
  return [venueHtml(p), ...links].join(' ');
}

/** Education line: bold degree, field (with <abbr> expansions), school kept on one line. */
export function educationFieldHtml(e: (typeof education)[number]): string {
  let field = escapeHtml(e.field);
  for (const [short, long] of Object.entries(e.abbr ?? {})) {
    field = field.replace(new RegExp(`\\b${short}\\b`), `<abbr title="${escapeHtml(long)}">${escapeHtml(short)}</abbr>`);
  }
  return field;
}

/** Headline terms, each kept on one line, separated by middle dots. */
export function headlineHtml(terms: string[]): string {
  return terms
    .map((t, i) => `<span class="nw">${escapeHtml(t)}${i < terms.length - 1 ? ' ·' : ''}</span>`)
    .join(' ');
}

/** "Paper"/"Papers", "Report"/"Reports" and so on. */
export function plural(word: string, n: number): string {
  return n === 1 ? word : `${word}s`;
}

/** News item text with its optional bracketed reference link. */
export function newsHtml(n: (typeof news)[number]): string {
  return inlineHtml(n.text) + (n.link ? ` <a class="ref" href="${escapeHtml(n.link.url)}">[${escapeHtml(n.link.label)}]</a>` : '');
}

/** Homepage "Selected publications": the newest three marked selected: true. Their #p-<id> anchors exist only there. */
export const HOME_PUB_COUNT = 3;
export const homePublications = sortPublications(publications.filter((p) => p.selected)).slice(0, HOME_PUB_COUNT);
export const homePubIds = new Set(homePublications.map((p) => p.id));

export const PUB_GROUP_LABEL: Record<Publication['type'], string> = {
  journal: 'Journal article',
  conference: 'Conference paper',
  report: 'Technical report',
};
