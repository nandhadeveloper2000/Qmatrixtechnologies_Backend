export function normalizeKeywords(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof input === "string") {
    return input
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function normalizeImage(input: any) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const url = String(input.url || "").trim();
  if (!url) return null;

  return {
    url,
    public_id: input.public_id ? String(input.public_id).trim() : null,
    alt: input.alt ? String(input.alt).trim() : "",
  };
}

export function normalizeSeoObject(input: any) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      metaTitle: "",
      metaDescription: "",
      keywords: [],
      canonicalUrl: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: null,
      robots: "index,follow",
    };
  }

  return {
    metaTitle: String(input.metaTitle || "").trim(),
    metaDescription: String(input.metaDescription || "").trim(),
    keywords: normalizeKeywords(input.keywords),
    canonicalUrl: String(input.canonicalUrl || "").trim(),
    ogTitle: String(input.ogTitle || "").trim(),
    ogDescription: String(input.ogDescription || "").trim(),
    ogImage: normalizeImage(input.ogImage),
    robots: String(input.robots || "index,follow").trim(),
  };
}

export function normalizePageSeo(input: any, pageKey: string) {
  return {
    pageKey: String(pageKey || "").trim().toLowerCase(),
    metaTitle: String(input.metaTitle || "").trim(),
    metaDescription: String(input.metaDescription || "").trim(),
    keywords: normalizeKeywords(input.keywords),
    canonicalUrl: String(input.canonicalUrl || "").trim(),
    ogTitle: String(input.ogTitle || "").trim(),
    ogDescription: String(input.ogDescription || "").trim(),
    ogImage: String(input.ogImage || "").trim(),
    robots: String(input.robots || "index,follow").trim(),
    schemaType: String(input.schemaType || "WebPage").trim(),
  };
}