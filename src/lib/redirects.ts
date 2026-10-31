// Redirect pages. Each becomes a real page (meta refresh + location.replace + visible link + canonical).
//
// CV_REDIRECTS: these URLs are printed on CVs already sent to employers. NEVER remove or rename them,
// never change their targets without the owner's say-so. scripts/check.mjs verifies them on every build.
// Targets copied from the old site: _layouts/ornl-profile.html, google-scholar.html, orcid.html, linkedin.html.
export const CV_REDIRECTS = [
  { path: 'ornl-profile', to: 'https://www.ornl.gov/staff-profile/jihoon-chung', label: "Jihoon Chung's ORNL Profile" },
  { path: 'google-scholar', to: 'https://scholar.google.com/citations?user=ExZUcKYAAAAJ&hl=en', label: "Jihoon Chung's Google Scholar" },
  { path: 'orcid', to: 'https://orcid.org/0000-0001-8488-0815', label: "Jihoon Chung's ORCID" },
  { path: 'linkedin', to: 'https://www.linkedin.com/in/jihoon-chung/', label: "Jihoon Chung's LinkedIn" },
] as const;

// LEGACY_REDIRECTS: URLs of the old Jekyll site. "to" is a path on this site ('' = home).
// The research posts used the Jekyll permalink ":title/" (file name without date and extension).
// Paper-review posts (PR_*) are intentionally NOT redirected; they stay 404.
const HOME = { to: '', label: 'the homepage of Jihoon Chung, Ph.D.' };
const RESEARCH = { to: 'research/', label: 'Research' };
const IDT = { to: 'research/interoperable-digital-twins/', label: 'Interoperable Digital Twins' };
const HBI = { to: 'research/human-building-interaction/', label: 'Human-Building Interaction' };

export const LEGACY_REDIRECTS = [
  { path: 'about', ...HOME },
  { path: 'blog', ...HOME },
  { path: 'designworks', to: 'design/', label: 'Design' },
  // Earlier work -> /research/
  { path: 'Research_Haebang-ro', ...RESEARCH },
  { path: 'Research-A_Comparative_Analysis_of_the_Classification_System_for_Three-Dimensional_Concrete_Printers', ...RESEARCH },
  { path: 'Research_How-to-Keep-Social-Connections-during-Social-Distancing', ...RESEARCH },
  { path: 'Research-A_Systematic_Review_of_the_Geographic_and_Chronological_Distributions_of_3D_Concrete_Printers_from_1997_to_2020', ...RESEARCH },
  { path: 'Research_Framework-for-technical-specifications-of-3D-concrete-printers', ...RESEARCH },
  // IEQ ontology (semantic model) -> Interoperable Digital Twins
  { path: 'Research_Towards-an-Indoor-Environmental-Quality-Management-Ontology', ...IDT },
  // Indoor air monitoring and natural ventilation -> Human-Building Interaction (matches the homepage plates)
  { path: 'Research_A-Framework-for-Monitoring-and-Identifying-Indoor-Air-Pollutants', ...HBI },
  { path: 'Research_Sustainability-Through-Optimal-Design-of-Buildings-for-Natural-Ventilation', ...HBI },
] as const;
