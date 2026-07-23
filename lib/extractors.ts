import type { HostPlatform, PageContext } from "./types";

function detectPlatform(url: string): HostPlatform {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("salesforce") || host.includes("force.com")) {
    return "salesforce";
  }
  if (host.includes("linkedin.com")) return "linkedin";
  if (host.includes("hubspot.com")) return "hubspot";
  return "unknown";
}

function textOf(selector: string): string | undefined {
  const el = document.querySelector(selector);
  const t = el?.textContent?.trim();
  return t || undefined;
}

function attrOf(selector: string, attr: string): string | undefined {
  const el = document.querySelector(selector);
  const v = el?.getAttribute(attr)?.trim();
  return v || undefined;
}

/** Salesforce Lightning / Classic-ish heuristics (selectors vary by org & version) */
function extractSalesforce(): PageContext["fields"] {
  const recordId =
    location.pathname.match(/\/([a-zA-Z0-9]{15,18})(?:\/|$)/)?.[1] ||
    attrOf("[data-recordid]", "data-recordid");

  return {
    recordId,
    name:
      textOf(".entityNameTitle") ||
      textOf("lightning-formatted-name") ||
      textOf("h1.slds-page-header__title") ||
      textOf('[data-aura-class*="forceInlineEdit"]'),
    email:
      textOf('a[href^="mailto:"]') ||
      attrOf('a[href^="mailto:"]', "href")?.replace(/^mailto:/i, ""),
    phone: textOf('a[href^="tel:"]'),
    company:
      textOf('[title="Account Name"] + *') ||
      textOf(".accountName") ||
      textOf('[data-target-selection-name*="Account"]'),
    title: textOf('[title="Title"] + *') || textOf(".title"),
  };
}

/** LinkedIn profile / Sales Navigator heuristics */
function extractLinkedIn(): PageContext["fields"] {
  const name =
    textOf("h1.text-heading-xlarge") ||
    textOf(".pv-text-details__left-panel h1") ||
    textOf('[data-anonymize="person-name"]');

  const title =
    textOf(".text-body-medium.break-words") ||
    textOf(".pv-text-details__left-panel .text-body-medium") ||
    textOf('[data-anonymize="headline"]');

  const company =
    textOf('[data-anonymize="company-name"]') ||
    textOf(".pv-text-details__right-panel .inline-show-more-text");

  return {
    name,
    title,
    company,
    profileUrl: location.href.split("?")[0],
    email: undefined,
    phone: undefined,
  };
}

function extractGeneric(): PageContext["fields"] {
  // Demo / ERP fallback: look for data attributes you can add in a host page
  return {
    name: attrOf("[data-companion-name]", "data-companion-name") || textOf("h1"),
    email: attrOf("[data-companion-email]", "data-companion-email"),
    phone: attrOf("[data-companion-phone]", "data-companion-phone"),
    company: attrOf("[data-companion-company]", "data-companion-company"),
    title: attrOf("[data-companion-title]", "data-companion-title"),
    recordId: attrOf("[data-companion-id]", "data-companion-id"),
  };
}

/**
 * DOM extraction — the "Trojan Horse" read path.
 * Reads contextual data from the host page without leaving the user's current tool.
 */
export function extractPageContext(): PageContext {
  const url = location.href;
  const platform = detectPlatform(url);

  let fields: PageContext["fields"];
  switch (platform) {
    case "salesforce":
      fields = extractSalesforce();
      break;
    case "linkedin":
      fields = extractLinkedIn();
      break;
    default:
      fields = extractGeneric();
  }

  return {
    platform,
    url,
    title: document.title,
    fields,
    extractedAt: new Date().toISOString(),
  };
}

/** Wait for SPA hosts (Lightning, LinkedIn) to settle before extraction */
export function observeReady(
  predicate: () => boolean,
  timeoutMs = 15000,
): Promise<boolean> {
  if (predicate()) return Promise.resolve(true);

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      observer.disconnect();
      resolve(false);
    }, timeoutMs);

    const observer = new MutationObserver(() => {
      if (predicate()) {
        clearTimeout(timer);
        observer.disconnect();
        resolve(true);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}
