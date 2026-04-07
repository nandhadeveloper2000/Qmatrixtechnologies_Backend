export const PAGE_SEO_ROBOTS = [
  "index,follow",
  "noindex,follow",
  "index,nofollow",
  "noindex,nofollow",
] as const;

export const PAGE_SEO_SCHEMA_TYPES = [
  "WebPage",
  "Article",
  "Course",
  "FAQPage",
] as const;

export type PageSeoRobots = (typeof PAGE_SEO_ROBOTS)[number];
export type PageSeoSchemaType = (typeof PAGE_SEO_SCHEMA_TYPES)[number];

export function normalizeKeywords(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 30);
  }

  if (typeof input === "string") {
    return input
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 30);
  }

  return [];
}

export function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\/.+/i.test(String(value || "").trim());
}

export function normalizePageKey(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function normalizeRobots(input: unknown): PageSeoRobots {
  const value = String(input || "index,follow").trim() as PageSeoRobots;
  return PAGE_SEO_ROBOTS.includes(value) ? value : "index,follow";
}

export function normalizeSchemaType(input: unknown): PageSeoSchemaType {
  const value = String(input || "WebPage").trim() as PageSeoSchemaType;
  return PAGE_SEO_SCHEMA_TYPES.includes(value) ? value : "WebPage";
}

export function normalizePageSeoPayload(
  body: Record<string, unknown>,
  pageKeyParam: string
) {
  return {
    pageKey: normalizePageKey(pageKeyParam),
    metaTitle: String(body.metaTitle || "").trim(),
    metaDescription: String(body.metaDescription || "").trim(),
    keywords: normalizeKeywords(body.keywords),
    canonicalUrl: String(body.canonicalUrl || "").trim(),
    ogTitle: String(body.ogTitle || "").trim(),
    ogDescription: String(body.ogDescription || "").trim(),
    ogImage: String(body.ogImage || "").trim(),
    robots: normalizeRobots(body.robots),
    schemaType: normalizeSchemaType(body.schemaType),
  };
}

export function validatePageSeoPayload(payload: {
  pageKey: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImage?: string;
}) {
  if (!payload.pageKey) {
    return "pageKey is required";
  }

  if (!payload.metaTitle) {
    return "metaTitle is required";
  }

  if (payload.metaTitle.length > 70) {
    return "metaTitle must be 70 characters or less";
  }

  if (!payload.metaDescription) {
    return "metaDescription is required";
  }

  if (payload.metaDescription.length > 170) {
    return "metaDescription must be 170 characters or less";
  }

  if (!payload.canonicalUrl) {
    return "canonicalUrl is required";
  }

  if (!isAbsoluteUrl(payload.canonicalUrl)) {
    return "canonicalUrl must be a valid absolute URL";
  }

  if (payload.ogImage && !isAbsoluteUrl(payload.ogImage)) {
    return "ogImage must be a valid absolute URL";
  }

  return null;
}