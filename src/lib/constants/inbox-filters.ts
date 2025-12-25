/**
 * Inbox Filters Configuration
 *
 * Rules for filtering operational emails in Vesta's inbox.
 * Only shows emails relevant to the real estate agency:
 * - Clients (buyers/sellers) from personal accounts
 * - Banks (mortgages, appraisals)
 * - Notaries
 * - Other agencies (collaborations)
 * - Real estate portals (leads)
 */

// ===================
// INCLUSION RULES
// ===================

/**
 * Domains that are always included
 */
export const ALLOWED_DOMAINS = [
  // Personal accounts (clients)
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "outlook.es",
  "hotmail.com",
  "hotmail.es",
  "live.com",
  "yahoo.com",
  "yahoo.es",
  "icloud.com",
  "me.com",
  "protonmail.com",

  // Real estate portals (specific senders whitelisted separately)
  "fotocasa.es",
  "habitaclia.com",
  "pisos.com",
  "yaencontre.com",
  "tucasa.com",

  // Banks
  "caixabank.com",
  "santander.es",
  "kutxabank.es",
  "bbva.com",
  "bankinter.com",
  "sabadell.com",
  "unicaja.es",
  "ibercaja.es",
  "abanca.com",
  "cajamar.es",
  "laboralkutxa.com",

  // Appraisers
  "tinsa.es",
  "tecnitasa.es",
  "euroval.com",
  "gesvalt.es",

  // Property registry
  "registradores.org",
] as const;

/**
 * Specific sender emails that are always included (whitelist)
 * Used for portals that send from specific addresses
 */
export const WHITELISTED_SENDERS = [
  "reply@idealista.com",
] as const;

/**
 * Patterns in sender email to detect real estate agencies
 */
export const AGENCY_PATTERNS = [
  "inmobiliaria",
  "inmo",
  "realestate",
  "fincas",
  "propert",
  "estate",
  "pisos",
  "casas",
  "viviendas",
  "hogares",
] as const;

/**
 * Keywords in subject that trigger inclusion
 */
export const SUBJECT_KEYWORDS = [
  // Property types
  "vivienda",
  "piso",
  "apartamento",
  "chalet",
  "casa",
  "adosado",
  "inmueble",
  "propiedad",
  "local",
  "oficina",
  "nave",
  "garaje",
  "parking",
  "trastero",
  "parcela",
  "terreno",
  "finca",
  "solar",

  // Operations
  "compra",
  "venta",
  "alquiler",
  "arrendamiento",
  "traspaso",
  "hipoteca",
  "financiación",
  "tasación",
  "valoración",
  "escritura",
  "arras",
  "señal",
  "reserva",
  "oferta",
  "contraoferta",
  "negociación",

  // Visits and contact
  "visita",
  "cita",
  "enseñar",
  "mostrar",
  "interesado",
  "interesada",
  "consulta",
  "información",

  // Legal/notarial
  "notaría",
  "notario",
  "firma",
  "escrituración",
  "registro",
  "inscripción",
  "nota simple",
] as const;

// ===================
// EXCLUSION RULES
// ===================

/**
 * Domains that are always excluded
 */
export const EXCLUDED_DOMAINS = [
  // Email marketing platforms
  "mailchimp.com",
  "sendgrid.net",
  "mailgun.org",
  "constantcontact.com",
  "hubspot.com",
  "salesforce.com",
  "mailerlite.com",
  "sendinblue.com",
  "getresponse.com",
  "klaviyo.com",
  "mailjet.com",

  // Social media
  "facebook.com",
  "facebookmail.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "tiktok.com",
  "pinterest.com",
  "substack.com",
  "quora.com",

  // Generic services (not real estate related)
  "google.com",
  "youtube.com",
  "spotify.com",
  "netflix.com",
  "amazon.com",
  "amazon.es",
  "apple.com",
  "dropbox.com",
  "slack.com",
  "zoom.us",
  "calendly.com",
] as const;

/**
 * Sender patterns that are always excluded
 */
export const EXCLUDED_SENDER_PATTERNS = [
  "noreply@",
  "no-reply@",
  "no_reply@",
  "noresponder@",
  "donotreply@",
  "enviosfotocasa@",
  "newsletter@",
  "newsletters@",
  "marketing@",
  "promo@",
  "promociones@",
  "ofertas@",
  "info@mailchimp",
  "bounce@",
  "mailer-daemon@",
  "notifications@",
  "notify@",
  "alert@",
  "alerts@",
  "updates@",
  "news@",
  "digest@",
  "weekly@",
  "monthly@",
] as const;

// ===================
// QUERY BUILDER
// ===================

/**
 * Build Gmail API query string for operational emails
 *
 * Strategy:
 * 1. Include emails from allowed domains OR matching agency patterns OR with subject keywords
 * 2. Exclude emails from excluded domains and sender patterns
 *
 * Note: Gmail query has a length limit (~1000 chars), so we prioritize the most important filters
 */
export function buildOperationalEmailQuery(): string {
  const parts: string[] = [];

  // Build inclusion query for domains (most important ones to fit in query limit)
  const priorityDomains = [
    // Personal accounts - these are crucial
    "gmail.com",
    "googlemail.com",
    "outlook.com",
    "hotmail.com",
    "yahoo.com",
    "icloud.com",
    // Portals
    "idealista.com",
    "fotocasa.es",
    "habitaclia.com",
    // Banks (main ones)
    "caixabank.com",
    "santander.es",
    "kutxabank.es",
    "bbva.com",
  ];

  const domainQuery = priorityDomains.map((d) => `from:@${d}`).join(" OR ");

  // Whitelisted senders (specific emails like reply@idealista.com)
  const whitelistQuery = WHITELISTED_SENDERS.map((s) => `from:${s}`).join(" OR ");

  // Agency patterns in sender
  const agencyQuery = AGENCY_PATTERNS.slice(0, 5)
    .map((p) => `from:${p}`)
    .join(" OR ");

  // Subject keywords (most important ones)
  const priorityKeywords = [
    "vivienda",
    "piso",
    "apartamento",
    "casa",
    "inmueble",
    "compra",
    "venta",
    "alquiler",
    "hipoteca",
    "visita",
    "interesado",
  ];
  const subjectQuery = priorityKeywords
    .map((k) => `subject:${k}`)
    .join(" OR ");

  // Combine inclusions
  parts.push(`(${whitelistQuery} OR ${domainQuery} OR ${agencyQuery} OR ${subjectQuery})`);

  // Build exclusion query
  const excludePatterns = [
    "noreply",
    "no-reply",
    "noresponder",
    "enviosfotocasa",
    "newsletter",
    "marketing",
    "promo",
    "notifications",
  ];
  const excludeQuery = excludePatterns.map((p) => `-from:${p}`).join(" ");

  const excludeDomains = [
    "mailchimp.com",
    "sendgrid.net",
    "hubspot.com",
    "facebook.com",
    "linkedin.com",
  ];
  const excludeDomainQuery = excludeDomains
    .map((d) => `-from:@${d}`)
    .join(" ");

  parts.push(excludeQuery);
  parts.push(excludeDomainQuery);

  // Only inbox, not sent/drafts
  parts.push("in:inbox");

  return parts.join(" ");
}

// ===================
// POST-FILTER (for emails that slip through Gmail query)
// ===================

/**
 * Check if an email should be excluded based on sender
 */
export function shouldExcludeEmail(senderEmail: string): boolean {
  const email = senderEmail.toLowerCase();

  // Check excluded sender patterns
  for (const pattern of EXCLUDED_SENDER_PATTERNS) {
    if (email.includes(pattern.toLowerCase())) {
      return true;
    }
  }

  // Check excluded domains
  const domain = email.split("@")[1];
  if (domain && EXCLUDED_DOMAINS.includes(domain as typeof EXCLUDED_DOMAINS[number])) {
    return true;
  }

  return false;
}

/**
 * Check if an email should be included based on sender
 */
export function shouldIncludeEmail(senderEmail: string, subject: string): boolean {
  const email = senderEmail.toLowerCase();
  const subjectLower = subject.toLowerCase();

  // First check whitelisted senders (highest priority, bypass exclusions)
  if (WHITELISTED_SENDERS.some((w) => email === w.toLowerCase())) {
    return true;
  }

  // Check exclusions (second priority)
  if (shouldExcludeEmail(senderEmail)) {
    return false;
  }

  // Check allowed domains
  const domain = email.split("@")[1];
  if (domain && ALLOWED_DOMAINS.includes(domain as typeof ALLOWED_DOMAINS[number])) {
    return true;
  }

  // Check agency patterns in email
  for (const pattern of AGENCY_PATTERNS) {
    if (email.includes(pattern.toLowerCase())) {
      return true;
    }
  }

  // Check subject keywords
  for (const keyword of SUBJECT_KEYWORDS) {
    if (subjectLower.includes(keyword.toLowerCase())) {
      return true;
    }
  }

  return false;
}

// ===================
// COMBINED CONFIG EXPORT
// ===================

export const INBOX_FILTERS = {
  allowedDomains: ALLOWED_DOMAINS,
  whitelistedSenders: WHITELISTED_SENDERS,
  agencyPatterns: AGENCY_PATTERNS,
  subjectKeywords: SUBJECT_KEYWORDS,
  excludedDomains: EXCLUDED_DOMAINS,
  excludedSenderPatterns: EXCLUDED_SENDER_PATTERNS,
  buildQuery: buildOperationalEmailQuery,
  shouldExclude: shouldExcludeEmail,
  shouldInclude: shouldIncludeEmail,
} as const;
