import { Request, Response } from "express";
import PageSEO from "../models/PageSEO.model";
import {
  normalizePageKey,
  normalizePageSeoPayload,
  validatePageSeoPayload,
} from "../utils/pageSeo.utils";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";

function getPageKeyFromReq(req: Request): string {
  return normalizePageKey(req.params.pageKey);
}

export const getPageSEOByKey = async (req: Request, res: Response) => {
  try {
    const { pageKey } = req.params;

    const seo = await PageSEO.findOne({ pageKey }).lean();

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
};
/* ADMIN/EDITOR: LIST PAGE SEO */
export const listPageSEO = asyncHandler(async (_req: Request, res: Response) => {
  const items = await PageSEO.find().sort({ pageKey: 1 }).lean();

  return res.status(200).json({
    success: true,
    count: items.length,
    data: items,
  });
});

/* ADMIN/EDITOR: CREATE OR UPDATE PAGE SEO */
export const upsertPageSEO = asyncHandler(async (req: Request, res: Response) => {
  const pageKey = getPageKeyFromReq(req);
  const payload = normalizePageSeoPayload(req.body ?? {}, pageKey);

  const validationError = validatePageSeoPayload(payload);

  if (validationError) {
    throw new ApiError(400, validationError);
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
});

/* ADMIN: DELETE PAGE SEO */
export const deletePageSEO = asyncHandler(async (req: Request, res: Response) => {
  const pageKey = getPageKeyFromReq(req);

  if (!pageKey) {
    throw new ApiError(400, "pageKey is required");
  }

  const deleted = await PageSEO.findOneAndDelete({ pageKey });

  if (!deleted) {
    throw new ApiError(404, "SEO record not found");
  }

  return res.status(200).json({
    success: true,
    message: "Page SEO deleted successfully",
  });
});