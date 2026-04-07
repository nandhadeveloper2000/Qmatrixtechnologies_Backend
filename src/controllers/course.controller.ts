import { Request, Response } from "express";
import { Readable } from "stream";
import { CourseModel } from "../models/course.model";
import { cloudinary } from "../config/cloudinary";
import { normalizeSlug } from "../utils/slug";

function toBool(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return fallback;
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
  const fallbackCanonical = `https://qmatrixtechnologies.com/course-detail/${slug}`;

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
    schemaType: "Course",
  };
}

function uploadBufferToCloudinary(
  fileBuffer: Buffer,
  folder = "qmatrix/Courses"
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Cloudinary upload failed"));

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    Readable.from(fileBuffer).pipe(stream);
  });
}

export async function uploadCourseImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const uploaded = await uploadBufferToCloudinary(req.file.buffer);

    return res.status(201).json({
      success: true,
      data: {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
        alt: "",
      },
    });
  } catch (error) {
    console.error("uploadCourseImage error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload image",
    });
  }
}

export async function deleteCourseImage(req: Request, res: Response) {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: "public_id is required",
      });
    }

    await cloudinary.uploader.destroy(public_id, {
      resource_type: "image",
    });

    return res.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("deleteCourseImage error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete image",
    });
  }
}

export async function createCourse(req: Request, res: Response) {
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

    const finalSlug = normalizeSlug(slugInput || title);

    if (!finalSlug) {
      return res.status(400).json({
        success: false,
        message: "valid slug is required",
      });
    }

    const existing = await CourseModel.findOne({ slug: finalSlug });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "slug already exists",
      });
    }

    const isPublished = toBool(body.isPublished, false);

    const doc = await CourseModel.create({
      title,
      slug: finalSlug,
      category: body.category || "New One",

      description: String(body.description || "").trim(),

      coverImage: parseObject(body.coverImage, null),
      galleryImages: parseArray(body.galleryImages),

      duration: String(body.duration || "").trim(),
      modulesCount: String(body.modulesCount || "").trim(),
      rating: Number(body.rating) || 0,

      sessionDuration: String(body.sessionDuration || "").trim(),
      classSchedule: String(body.classSchedule || "").trim(),
      mode: body.mode || "Online/Offline",
      enrolled: String(body.enrolled || "").trim(),
      placementSupport: toBool(body.placementSupport, true),

      whatYouWillLearn: parseArray<string>(body.whatYouWillLearn),
      features: parseArray(body.features),
      supportAndCareer: parseArray<string>(body.supportAndCareer),
      curriculum: parseArray(body.curriculum),

      interviewQuestions: parseArray(body.interviewQuestions),
      faq: parseArray(body.faq),

      seo: parseSeo(body.seo, finalSlug),

      isFeatured: toBool(body.isFeatured, false),
      isPublished,
      publishedAt: isPublished ? new Date() : null,

      createdBy: req.user?.uid || null,
      updatedBy: req.user?.uid || null,
    });

    return res.status(201).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error("createCourse error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create course",
    });
  }
}

export async function adminListCourses(req: Request, res: Response) {
  try {
    const items = await CourseModel.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role");

    return res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("adminListCourses error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
    });
  }
}

export async function listPublishedCourses(req: Request, res: Response) {
  try {
    const category = String(req.query.category || "").trim();
    const featured = String(req.query.featured || "").trim();

    const filter: Record<string, unknown> = {
      isPublished: true,
    };

    if (category) filter.category = category;
    if (featured === "true") filter.isFeatured = true;

    const items = await CourseModel.find(filter)
      .select(
        "title slug category description coverImage duration modulesCount rating isFeatured seo createdAt publishedAt updatedAt"
      )
      .sort({ publishedAt: -1, createdAt: -1 });

    return res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("listPublishedCourses error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch published courses",
    });
  }
}

export async function adminGetCourseById(req: Request, res: Response) {
  try {
    const doc = await CourseModel.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("updatedBy", "name email role");

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error("adminGetCourseById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch course",
    });
  }
}

export async function getPublishedCourseBySlug(req: Request, res: Response) {
  try {
    const doc = await CourseModel.findOne({
      slug: req.params.slug,
      isPublished: true,
    }).lean();

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error("getPublishedCourseBySlug error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch course",
    });
  }
}

export async function updateCourse(req: Request, res: Response) {
  try {
    const body = req.body ?? {};

    const existing = await CourseModel.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let nextSlug = existing.slug;

    if (body.slug || body.title) {
      nextSlug = normalizeSlug(body.slug || body.title || existing.title);

      if (!nextSlug) {
        return res.status(400).json({
          success: false,
          message: "valid slug is required",
        });
      }

      const slugExists = await CourseModel.findOne({
        slug: nextSlug,
        _id: { $ne: existing._id },
      });

      if (slugExists) {
        return res.status(409).json({
          success: false,
          message: "slug already exists",
        });
      }
    }

    const nextIsPublished = toBool(body.isPublished, existing.isPublished);

    const payload: Record<string, unknown> = {
      ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
      slug: nextSlug,

      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.description !== undefined
        ? { description: String(body.description).trim() }
        : {}),

      ...(body.coverImage !== undefined
        ? { coverImage: parseObject(body.coverImage, null) }
        : {}),
      ...(body.galleryImages !== undefined
        ? { galleryImages: parseArray(body.galleryImages) }
        : {}),

      ...(body.duration !== undefined
        ? { duration: String(body.duration).trim() }
        : {}),
      ...(body.modulesCount !== undefined
        ? { modulesCount: String(body.modulesCount).trim() }
        : {}),
      ...(body.rating !== undefined ? { rating: Number(body.rating) || 0 } : {}),

      ...(body.sessionDuration !== undefined
        ? { sessionDuration: String(body.sessionDuration).trim() }
        : {}),
      ...(body.classSchedule !== undefined
        ? { classSchedule: String(body.classSchedule).trim() }
        : {}),
      ...(body.mode !== undefined ? { mode: body.mode } : {}),
      ...(body.enrolled !== undefined
        ? { enrolled: String(body.enrolled).trim() }
        : {}),
      ...(body.placementSupport !== undefined
        ? { placementSupport: toBool(body.placementSupport, true) }
        : {}),

      ...(body.whatYouWillLearn !== undefined
        ? { whatYouWillLearn: parseArray<string>(body.whatYouWillLearn) }
        : {}),
      ...(body.features !== undefined
        ? { features: parseArray(body.features) }
        : {}),
      ...(body.supportAndCareer !== undefined
        ? { supportAndCareer: parseArray<string>(body.supportAndCareer) }
        : {}),
      ...(body.curriculum !== undefined
        ? { curriculum: parseArray(body.curriculum) }
        : {}),
      ...(body.interviewQuestions !== undefined
        ? { interviewQuestions: parseArray(body.interviewQuestions) }
        : {}),
      ...(body.faq !== undefined ? { faq: parseArray(body.faq) } : {}),
      ...(body.seo !== undefined ? { seo: parseSeo(body.seo, nextSlug) } : {}),
      ...(body.isFeatured !== undefined
        ? { isFeatured: toBool(body.isFeatured, false) }
        : {}),

      isPublished: nextIsPublished,
      updatedBy: req.user?.uid || null,
    };

    if (nextIsPublished && !existing.publishedAt) {
      payload.publishedAt = new Date();
    }

    if (!nextIsPublished) {
      payload.publishedAt = null;
    }

    const doc = await CourseModel.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    return res.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error("updateCourse error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update course",
    });
  }
}

export async function deleteCourse(req: Request, res: Response) {
  try {
    const doc = await CourseModel.findByIdAndDelete(req.params.id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("deleteCourse error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete course",
    });
  }
}