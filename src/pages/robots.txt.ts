// robots.txt: preview builds block all crawling; production allows all and points to the sitemap.
// (On the preview's project subpath crawlers do not read this file; the noindex meta tag is what protects it.)
import type { APIRoute } from 'astro';
import { IS_PREVIEW, absUrl } from '../lib/site';

export const GET: APIRoute = () =>
  new Response(
    IS_PREVIEW
      ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nAllow: /\n\nSitemap: ${absUrl('sitemap-index.xml')}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
