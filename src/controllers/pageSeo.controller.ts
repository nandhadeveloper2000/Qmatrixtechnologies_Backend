import { Request, Response } from "express";
import PageSEO from "../models/PageSEO.model";

function normalizeKeywords(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof input === "string") {
    return input
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizePageSeoPayload(
  body: Record<string, unknown>,
  pageKey: string
) {
  return {
    pageKey: String(pageKey || "").trim().toLowerCase(),
    metaTitle: String(body.metaTitle || "").trim(),
    metaDescription: String(body.metaDescription || "").trim(),
    keywords: normalizeKeywords(body.keywords),
    canonicalUrl: String(body.canonicalUrl || "").trim(),
    ogTitle: String(body.ogTitle || "").trim(),
    ogDescription: String(body.ogDescription || "").trim(),
    ogImage: String(body.ogImage || "").trim(),
    robots: String(body.robots || "index,follow").trim(),
    schemaType: String(body.schemaType || "WebPage").trim(),
  };
}

/* =========================
   PUBLIC: GET PAGE SEO BY KEY
========================= */
export async function getPageSEOByKey(req: Request, res: Response) {
  try {
    const rawPageKey = req.params.pageKey;
    const pageKey = Array.isArray(rawPageKey) ? rawPageKey[0] : rawPageKey ?? "";

    const seo = await PageSEO.findOne({
      pageKey: String(pageKey).trim().toLowerCase(),
    }).lean();

    if (!seo) {
      return res.status(404).json({
        success: false,
        message: "SEO not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: seo,
    });
  } catch (error) {
    console.error("getPageSEOByKey error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch page SEO",
    });
  }
}

/* =========================
   ADMIN: CREATE / UPDATE PAGE SEO
========================= */
export async function upsertPageSEO(req: Request, res: Response) {
  try {
    const rawPageKey = req.params.pageKey;
    const pageKey = Array.isArray(rawPageKey) ? rawPageKey[0] : rawPageKey ?? "";

    const payload = normalizePageSeoPayload(req.body ?? {}, pageKey);

    if (!payload.pageKey) {
      return res.status(400).json({
        success: false,
        message: "pageKey is required",
      });
    }

    if (!payload.metaTitle) {
      return res.status(400).json({
        success: false,
        message: "metaTitle is required",
      });
    }

    if (!payload.metaDescription) {
      return res.status(400).json({
        success: false,
        message: "metaDescription is required",
      });
    }

    if (!payload.canonicalUrl) {
      return res.status(400).json({
        success: false,
        message: "canonicalUrl is required",
      });
    }

    const seo = await PageSEO.findOneAndUpdate(
      { pageKey: payload.pageKey },
      payload,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Page SEO saved successfully",
      data: seo,
    });
  } catch (error) {
    console.error("upsertPageSEO error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save page SEO",
    });
  }
}

/* =========================
   ADMIN: LIST ALL PAGE SEO
========================= */
export async function listPageSEO(_req: Request, res: Response) {
  try {
    const items = await PageSEO.find().sort({ pageKey: 1 }).lean();

    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("listPageSEO error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch page SEO list",
    });
  }
}

/* =========================
   ADMIN: DELETE PAGE SEO
========================= */
export async function deletePageSEO(req: Request, res: Response) {
  try {
    const rawPageKey = req.params.pageKey;
    const pageKey = Array.isArray(rawPageKey) ? rawPageKey[0] : rawPageKey ?? "";

    const doc = await PageSEO.findOneAndDelete({
      pageKey: String(pageKey).trim().toLowerCase(),
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "SEO record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Page SEO deleted successfully",
    });
  } catch (error) {
    console.error("deletePageSEO error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete page SEO",
    });
  }
}