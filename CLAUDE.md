# j-chung.kr: maintenance guide

Personal research website of Jihoon Chung, Ph.D. Astro 5.18.2 (pinned), static output, deployed to
GitHub Pages by `.github/workflows/deploy.yml`. Content lives in `src/data/*.yml`; pages render from it.

## Rules (read before changing any text)

- Every claim must trace to `/Users/jihoon.ai/projects/faculty-applications/masters/canonical-facts.md`
  or the latest CV. If it is not there, do not add it; ask the owner.
- Funded-project role is **"contributor and developer"**. Never "lead", "PI", "principal investigator", "managed".
- No unpublished numbers. Only numbers already in a published paper or report, or on the CV.
- No em dashes or en dashes anywhere in site text (use commas, colons, "to" for ranges). `npm run check` enforces this.
- Never write "trained as an architect".
- No email address anywhere on the site (the owner's rule): visitors use the form on `/contact/`. Only the CV PDF
  carries contact details.
- Theme 3 is **"Human-Building Interaction"** (exact spelling).
- The CV-printed redirect URLs must never break: `/ornl-profile/`, `/google-scholar/`, `/orcid/`, `/linkedin/`
  (list in `src/lib/redirects.ts`; `npm run check` verifies them independently). Do not rename or remove them.
- Before every push: run `git fetch && git log HEAD..origin/main` and inspect any commits not made in the
  current session (the owner may have edited on GitHub). Rebase onto them; never force-push over them.
- Never add a `CNAME` file (the custom domain is attached at cutover, in the Pages settings).

## Commands

```sh
npm install                         # once
npm run dev                         # local preview at http://localhost:4321/ (live reload)
npm run build                       # production build into dist/ (https://j-chung.kr, base /)
SITE_MODE=preview npm run build     # preview build (https://jchung-research.github.io/j-chung.kr/, noindex)
npm run check                       # build + verify links, CV redirects, no dashes (run before every push)
SITE_MODE=preview npm run check     # same, in preview mode
SITE_MODE=preview npx astro preview # serve the preview build at http://localhost:4321/j-chung.kr/
```

Build modes are decided in one place, `astro.config.mjs` (`SITE_MODE`). In GitHub Actions the mode comes
from the repository variable `SITE_MODE` (set it to `preview` in the preview repository; leave it unset for
production). Analytics: set the repository variable `GOATCOUNTER_CODE` (the `xxx` of `xxx.goatcounter.com`);
unset means no analytics tag at all.

Every internal link or asset must go through `url()` from `src/lib/site.ts` (base-aware). `npm run check`
fails on a root-relative link that ignores the base.

## Where things are

| What | File |
| --- | --- |
| Name, role, bio, links, credentials, headshot, contact form settings | `src/data/profile.yml` |
| Degrees | `src/data/education.yml` |
| News (homepage shows the newest three; /news/ lists all) | `src/data/news.yml` |
| Publications | `src/data/publications.yml` |
| Funded projects | `src/data/projects.yml` |
| Software | `src/data/software.yml` |
| Research themes (homepage theme cards, /research/ cards) | `src/data/themes.yml` |
| Recent projects (homepage cards, each with its own diagram) | `src/data/recent.yml`, `src/components/diagrams/Project*.astro` |
| Talks | `src/data/talks.yml` |
| Teaching and mentoring (Stage 2) | `src/data/teaching.yml` |
| Service (Stage 2) | `src/data/service.yml` |
| Redirect pages | `src/lib/redirects.ts` |
| CV PDF and its label | `public/cv/`, `src/pages/cv.astro` (`CV_FILE`, `CV_LABEL`) |
| Images | `public/images/` |
| Styles (copied from the approved mockups) | `src/styles/global.css` |
| Browser-tab title format | `src/layouts/Base.astro` (`fullTitle`) |
| Light/dark switch (header button; choice kept in localStorage) | `src/components/Header.astro`, scripts in `src/layouts/Base.astro` |

Each data file starts with a comment listing its fields. The build validates every file and stops with a
message naming the file and field if something is wrong. Use quotes around dates (`"2026-09"`).

## Recipes

**Add a publication** (`src/data/publications.yml`; order does not matter, pages sort by date):

```yaml
- id: eb2027                       # unique; anchor becomes #p-eb2027
  type: journal                    # journal | conference | report
  title: Title as published
  authors: ["Chung, J.", "Coauthor, A."]   # "Chung, J." is bolded automatically; end with "et al." to shorten
  venue: Energy and Buildings      # italic
  year: 2027
  month: 3                         # optional
  volume: 350                      # optional: volume, issue, pages, number (article number)
  number: 116000
  doi: 10.1016/j.enbuild.2027.116000
  pdf:                             # optional open-access PDF URL
  code:                            # optional repository URL
  bibtex: chung2027energy
  short: Energy and Buildings 2027 # label used in "Paper:" links
  themes: [grid-interactive-efficient-buildings]
  selected: false                  # true = listed on the homepage
```

For proceedings use `venue: Proceedings of X 2027` and `place: City`; for reports use `publisher:`.

**Add a news item** (`src/data/news.yml`):

```yaml
- date: "2027-03"
  text: Paper on ... published in Energy and Buildings [[DOI]](https://doi.org/10.1016/j.enbuild.2027.116000).
```

`[label](url)` makes a link; `[[DOI]](url)` gives the small bracketed reference style. Optional
`link: { url: ..., label: DOI }` appends a reference at the end.

**Add a talk** (`src/data/talks.yml`; appears on the theme pages listed in `themes`):

```yaml
- date: "2027-03-02"
  title: Title of the talk
  event: Name of the session or conference
  organizer: ASHRAE
  kind: talk
  themes: [grid-interactive-efficient-buildings]
```

**Add software** (`src/data/software.yml`; homepage order = file order):

```yaml
- id: newtool
  name: NewTool
  description: What it does, in one sentence.
  language: Python
  stack: [Python, Brick Schema]
  repo: https://github.com/JChung-Research/newtool
  license: MIT                     # leave empty if the repository states none
  theme: interoperable-digital-twins
```

**Add a funded project** (`src/data/projects.yml`; list order = file order):

```yaml
- title: Project title as on the CV
  sponsor: DOE Building Technologies Office
  start: "2027-01"
  end:                              # empty = "to present"
  role: Contributor and developer
  report_doi:                       # optional; must also be in publications.yml
  theme: grid-interactive-efficient-buildings
```

**New CV PDF**: add `public/cv/Jihoon-Chung-CV-YYYY-MM.pdf`, update `CV_FILE` and `CV_LABEL` in
`src/pages/cv.astro`. Keep the old file only if something links to it. The preview build leaves every PDF out (a PDF
cannot carry a noindex tag), so the CV PDF only appears on the production site.

**Contact form**: `/contact/` is the owner's original Formspree form from the old site (form ID in
`src/data/profile.yml`, `contact_form.key`; fields email, name, subject, message; inbox subject "New Contact Form
Submission"). The form ID is public by design; the delivery address lives in the Formspree account. The form has
Formspree's reCAPTCHA on, so it posts the normal way and Formspree shows the check and its thank-you page. Empty
key = the page shows a short note instead of the form.

**Stub pages** (Software, Design, Publications, Talks, Teaching & Mentoring, two research themes) use
`src/layouts/Stub.astro`. Replace a stub with a real page in the inner-page style of
`src/pages/research/grid-interactive-efficient-buildings.astro`.

After any change: `npm run check`, look at the page with `npm run dev`, then commit.
