import { Request, Response } from "express";
import PageSEO from "../models/PageSEO.model";
import {
  normalizePageKey,
  normalizePageSeoPayload,
  validatePageSeoPayload,
} from "../utils/pageSeo.utils";

function getPageKeyFromReq(req: Request): string {
  return normalizePageKey(req.params.pageKey);
}

/* PUBLIC: GET ONE PAGE SEO */
export async function getPageSEOByKey(req: Request, res: Response) {
  try {
    const pageKey = getPageKeyFromReq(req);

    if (!pageKey) {
      return res.status(400).json({
        success: false,
        message: "pageKey is required",
      });
    }

    const seo = await PageSEO.findOne({ pageKey }).lean();

    if (!seo) {
      return res.status(404).json({
        success: false,
        message: "SEO record not found",
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

/* ADMIN/EDITOR: LIST PAGE SEO */
export async function listPageSEO(_req: Request, res: Response) {
  try {
    const items = await PageSEO.find().sort({ pageKey: 1 }).lean();

    return res.status(200).json({
      success: true,
      count: items.length,
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

/* ADMIN/EDITOR: CREATE OR UPDATE PAGE SEO */
export async function upsertPageSEO(req: Request, res: Response) {
  try {
    const pageKey = getPageKeyFromReq(req);
    const payload = normalizePageSeoPayload(req.body ?? {}, pageKey);

    const validationError = validatePageSeoPayload(payload);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
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
  } catch (error: any) {
    console.error("upsertPageSEO error:", error);

    if (error?.name === "ValidationError") {
      const firstMessage =
        Object.values(error.errors || {})[0]?.message || "Validation failed";

      return res.status(400).json({
        success: false,
        message: firstMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to save page SEO",
    });
  }
}

/* ADMIN: DELETE PAGE SEO */
export async function deletePageSEO(req: Request, res: Response) {
  try {
    const pageKey = getPageKeyFromReq(req);

    if (!pageKey) {
      return res.status(400).json({
        success: false,
        message: "pageKey is required",
      });
    }

    const deleted = await PageSEO.findOneAndDelete({ pageKey });

    if (!deleted) {
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