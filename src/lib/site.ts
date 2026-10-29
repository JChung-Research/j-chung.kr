// Site-wide helpers. Every internal link and asset URL goes through url() so that the
// preview build (base /j-chung.kr/) and the production build (base /) both work.

export const SITE_MODE = __SITE_MODE__;
export const IS_PREVIEW = SITE_MODE === 'preview';
export const GOATCOUNTER_CODE = __GOATCOUNTER_CODE__;

/** Build year, used in the footer. The yearly scheduled rebuild keeps it current. */
export const BUILD_YEAR = new Date().getFullYear();

const BASE = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : import.meta.env.BASE_URL + '/';

/**
 * Base-aware internal URL.
 * url('')                -> '/'                or '/j-chung.kr/'
 * url('research/')       -> '/research/'       or '/j-chung.kr/research/'
 * url('/images/a.jpg')   -> '/images/a.jpg'    or '/j-chung.kr/images/a.jpg'
 * url('#news')           -> '/#news'           (fragments keep their page)
 */
export function url(path = ''): string {
  return (BASE + String(path).replace(/^\/+/, '')).replace(/\/{2,}/g, '/');
}

/** Absolute URL on the current deployment (for canonical, Open Graph, JSON-LD). */
export function absUrl(path = ''): string {
  return new URL(url(path), import.meta.env.SITE).href;
}

/** Path of the current page with the base removed, e.g. 'research/grid-interactive-efficient-buildings/'. */
export function pagePath(pathname: string): string {
  const p = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname.replace(/^\/+/, '');
  return p;
}
