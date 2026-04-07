import { Request, Response } from "express";
import { BlogModel } from "../models/blog.model";

function normalizeSlug(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

function parseArray<T>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value as T[];

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function parseObject<T>(value: unknown, fallback: T): T {
  if (value === null) return fallback;

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as T)
        : fallback;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function toBool(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return fallback;
}

function normalizeKeywords(input: unknown): string[] {
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

function isAbsoluteUrl(value: unknown) {
  return /^https?:\/\/.+/i.test(String(value || "").trim());
}

function parseSeo(value: unknown, slug: string) {
  const seo = parseObject<any>(value, {});
  const fallbackCanonical = `https://qmatrixtechnologies.com/blogs/${slug}`;

  const ogImage = seo?.ogImage ? parseObject(seo.ogImage, null) : null;

  return {
    metaTitle: String(seo?.metaTitle || "").trim(),
    metaDescription: String(seo?.metaDescription || "").trim(),
    keywords: normalizeKeywords(seo?.keywords),
    canonicalUrl: isAbsoluteUrl(seo?.canonicalUrl)
      ? String(seo.canonicalUrl).trim()
      : fallbackCanonical,
    ogTitle: String(seo?.ogTitle || "").trim(),
    ogDescription: String(seo?.ogDescription || "").trim(),
    ogImage,
    robots: [
      "index,follow",
      "noindex,follow",
      "index,nofollow",
      "noindex,nofollow",
    ].includes(String(seo?.robots || "").trim())
      ? String(seo.robots).trim()
      : "index,follow",
    schemaType: "Article",
  };
}

export async function createBlog(req: Request, res: Response) {
  try {
    const body = req.body ?? {};

    const title = String(body.title || "").trim();
    const slugInput = String(body.slug || "").trim();

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "title is required",
      });
    }

    const finalSlug = slugInput ? normalizeSlug(slugInput) : normalizeSlug(title);

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

    const isPublished = toBool(body.isPublished, false);

    const doc = await BlogModel.create({
      title,
      slug: finalSlug,
      excerpt: String(body.excerpt || "").trim(),
      introTitle: String(body.introTitle || "").trim(),
      introDescription: String(body.introDescription || "").trim(),
      category: String(body.category || "General").trim(),
      tags: parseArray<string>(body.tags),
      coverImage: parseObject(body.coverImage, null),
      authorName: String(body.authorName || "").trim(),
      location: String(body.location || "").trim(),
      readTime: Number(body.readTime) || 5,
      views: Number(body.views) || 0,
      sections: parseArray(body.sections),
      faqs: parseArray(body.faqs),
      seo: parseSeo(body.seo, finalSlug),
      isPublished,
      publishedAt: isPublished ? body.publishedAt || new Date() : null,
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
      .populate("createdBy", "name email role");

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

export async function getBlogById(req: Request, res: Response) {
  try {
    const doc = await BlogModel.findById(req.params.id).populate(
      "createdBy",
      "name email role"
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
    console.error("getBlogById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
    });
  }
}

export async function updateBlog(req: Request, res: Response) {
  try {
    const body = req.body ?? {};
    const existing = await BlogModel.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    let nextSlug = existing.slug;

    if (body.slug || body.title) {
      nextSlug = normalizeSlug(body.slug || body.title || existing.title);

      if (!nextSlug) {
        return res.status(400).json({
          success: false,
          message: "Valid slug is required",
        });
      }

      const slugExists = await BlogModel.findOne({
        slug: nextSlug,
        _id: { $ne: req.params.id },
      });

      if (slugExists) {
        return res.status(409).json({
          success: false,
          message: "Slug already exists",
        });
      }
    }

    const nextIsPublished = toBool(body.isPublished, existing.isPublished);

    const payload: Record<string, any> = {
      ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
      slug: nextSlug,
      ...(body.excerpt !== undefined ? { excerpt: String(body.excerpt).trim() } : {}),
      ...(body.introTitle !== undefined
        ? { introTitle: String(body.introTitle).trim() }
        : {}),
      ...(body.introDescription !== undefined
        ? { introDescription: String(body.introDescription).trim() }
        : {}),
      ...(body.category !== undefined
        ? { category: String(body.category).trim() }
        : {}),
      ...(body.tags !== undefined ? { tags: parseArray<string>(body.tags) } : {}),
      ...(body.coverImage !== undefined
        ? { coverImage: parseObject(body.coverImage, null) }
        : {}),
      ...(body.authorName !== undefined
        ? { authorName: String(body.authorName).trim() }
        : {}),
      ...(body.location !== undefined
        ? { location: String(body.location).trim() }
        : {}),
      ...(body.readTime !== undefined
        ? { readTime: Number(body.readTime) || 5 }
        : {}),
      ...(body.views !== undefined ? { views: Number(body.views) || 0 } : {}),
      ...(body.sections !== undefined ? { sections: parseArray(body.sections) } : {}),
      ...(body.faqs !== undefined ? { faqs: parseArray(body.faqs) } : {}),
      ...(body.seo !== undefined ? { seo: parseSeo(body.seo, nextSlug) } : {}),
      isPublished: nextIsPublished,
    };

    if (nextIsPublished && !existing.publishedAt) {
      payload.publishedAt = new Date();
    }

    if (!nextIsPublished) {
      payload.publishedAt = null;
    }

    const doc = await BlogModel.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name email role");

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

export async function listPublishedBlogs(req: Request, res: Response) {
  try {
    const blogs = await BlogModel.find({ isPublished: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: blogs,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch published blogs",
    });
  }
}

export async function getBlogBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    const blog = await BlogModel.findOne({
      slug,
      isPublished: true,
    }).lean();

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.json({
      success: true,
      data: blog,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch blog",
    });
  }
}

export async function adminListBlogs(req: Request, res: Response) {
  try {
    const items = await BlogModel.find({})
      .populate("createdBy", "name role email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("adminListBlogs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
    });
  }
}