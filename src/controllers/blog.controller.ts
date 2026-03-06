import { Request, Response } from "express";
import { BlogModel } from "../models/Blog";

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

export async function createBlog(req: Request, res: Response) {
  try {
    const {
      title,
      slug,
      excerpt,
      contentHtml,
      category,
      tags,
      coverImage,
      authorName,
      location,
      readTime,
      views,
      faqs,
      isPublished,
      publishedAt,
    } = req.body;

    if (!title || !contentHtml) {
      return res.status(400).json({
        success: false,
        message: "title and contentHtml are required",
      });
    }

    const finalSlug = slug ? normalizeSlug(slug) : normalizeSlug(title);

    if (!finalSlug) {
      return res.status(400).json({
        success: false,
        message: "Valid slug is required",
      });
    }

    const exists = await BlogModel.findOne({ slug: finalSlug });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Slug already exists",
      });
    }

    const doc = await BlogModel.create({
      title: title.trim(),
      slug: finalSlug,
      excerpt: excerpt || "",
      contentHtml,
      category: category || "General",
      tags: Array.isArray(tags) ? tags : [],
      coverImage: coverImage || null,
      authorName: authorName || "",
      location: location || "",
      readTime: Number(readTime) || 5,
      views: Number(views) || 0,
      faqs: Array.isArray(faqs) ? faqs : [],
      isPublished: Boolean(isPublished),
      publishedAt: isPublished ? publishedAt || new Date() : null,
      createdBy: req.user!.uid,
    });

    return res.status(201).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error("createBlog error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create blog",
    });
  }
}

export async function listBlogs(req: Request, res: Response) {
  try {
    const publishedOnly = req.query.published === "true";

    const filter = publishedOnly ? { isPublished: true } : {};

    const items = await BlogModel.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .populate("createdBy", "name email");

    return res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("listBlogs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
    });
  }
}

export async function getBlogBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    const doc = await BlogModel.findOne({ slug }).populate(
      "createdBy",
      "name email"
    );

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error("getBlogBySlug error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
    });
  }
}

export async function updateBlog(req: Request, res: Response) {
  try {
    const existing = await BlogModel.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    if (req.body.slug) {
      const finalSlug = normalizeSlug(req.body.slug);

      if (!finalSlug) {
        return res.status(400).json({
          success: false,
          message: "Valid slug is required",
        });
      }

      const slugExists = await BlogModel.findOne({
        slug: finalSlug,
        _id: { $ne: req.params.id },
      });

      if (slugExists) {
        return res.status(409).json({
          success: false,
          message: "Slug already exists",
        });
      }

      req.body.slug = finalSlug;
    }

    if (
      req.body.isPublished === true &&
      !req.body.publishedAt &&
      !existing.publishedAt
    ) {
      req.body.publishedAt = new Date();
    }

    const doc = await BlogModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    return res.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error("updateBlog error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update blog",
    });
  }
}

export async function deleteBlog(req: Request, res: Response) {
  try {
    const doc = await BlogModel.findByIdAndDelete(req.params.id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    return res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("deleteBlog error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete blog",
    });
  }
}