// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Build modes: the ONE place they are decided.
//   SITE_MODE=preview  -> GitHub Pages project preview, noindex everywhere, no sitemap.
//   (unset/anything)   -> production at https://j-chung.kr.
export const SITE_MODE = process.env.SITE_MODE === 'preview' ? 'preview' : 'production';
export const IS_PREVIEW = SITE_MODE === 'preview';
export const SITE = IS_PREVIEW ? 'https://jchung-research.github.io' : 'https://j-chung.kr';
export const BASE = IS_PREVIEW ? '/j-chung.kr' : '/';

// GoatCounter site code (the "xxx" in xxx.goatcounter.com). Empty means no analytics tag at all.
export const GOATCOUNTER_CODE = (process.env.GOATCOUNTER_CODE || '').trim();

// Redirect pages are kept out of the sitemap.
const NOT_IN_SITEMAP = /\/(ornl-profile|google-scholar|orcid|linkedin|about|blog|contact|designworks|Research[_-][^/]*)\/$/;

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: IS_PREVIEW ? [] : [sitemap({ filter: (page) => !NOT_IN_SITEMAP.test(page) })],
  vite: {
    define: {
      __SITE_MODE__: JSON.stringify(SITE_MODE),
      __GOATCOUNTER_CODE__: JSON.stringify(GOATCOUNTER_CODE),
    },
  },
});
