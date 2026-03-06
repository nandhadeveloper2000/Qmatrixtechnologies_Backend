import { Request, Response } from "express";
import { Readable } from "stream";
import { CourseModel } from "../models/Course";
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
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function parseObject<T extends object>(value: unknown, fallback: T): T {
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

function uploadBufferToCloudinary(
  fileBuffer: Buffer,
  folder = "qmatrix/courses"
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

/* =========================
   IMAGE UPLOAD
========================= */
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

/* =========================
   IMAGE DELETE
========================= */
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

/* =========================
   CREATE COURSE
========================= */
export async function createCourse(req: Request, res: Response) {
  try {
    const title = String(req.body.title || "").trim();
    const slugInput = String(req.body.slug || "").trim();

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

    const doc = await CourseModel.create({
      title,
      slug: finalSlug,
      category: req.body.category || "New One",

      shortDesc: req.body.shortDesc || "",
      description: req.body.description || "",
      overview: req.body.overview || "",

      coverImage: parseObject(req.body.coverImage, null as any),
      galleryImages: parseArray(req.body.galleryImages),

      duration: req.body.duration || "",
      modulesCount: req.body.modulesCount || "",
      rating: Number(req.body.rating) || 0,

      sessionDuration: req.body.sessionDuration || "",
      classSchedule: req.body.classSchedule || "",
      mode: req.body.mode || "Online/Offline",
      enrolled: req.body.enrolled || "",
      batchSize: req.body.batchSize || "",
      admissionFee:
        req.body.admissionFee === "" || req.body.admissionFee == null
          ? null
          : Number(req.body.admissionFee),
      placementSupport: toBool(req.body.placementSupport, true),

      features: parseArray<string>(req.body.features),
      support: parseArray<string>(req.body.support),
      curriculum: parseArray(req.body.curriculum),
      trainers: parseArray(req.body.trainers),
      reviews: parseArray(req.body.reviews),

      seo: parseObject(req.body.seo, {}),

      isFeatured: toBool(req.body.isFeatured, false),
      isPublished: toBool(req.body.isPublished, false),
      publishedAt: toBool(req.body.isPublished, false) ? new Date() : null,

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

/* =========================
   ADMIN LIST
========================= */
export async function adminListCourses(req: Request, res: Response) {
  try {
    const items = await CourseModel.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

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

/* =========================
   PUBLIC LIST
========================= */
export async function listPublishedCourses(req: Request, res: Response) {
  try {
    const category = String(req.query.category || "").trim();
    const featured = String(req.query.featured || "").trim();

    const filter: Record<string, any> = {
      isPublished: true,
    };

    if (category) filter.category = category;
    if (featured === "true") filter.isFeatured = true;

    const items = await CourseModel.find(filter)
      .select(
        "title slug category shortDesc coverImage duration modulesCount rating isFeatured createdAt"
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

/* =========================
   GET COURSE BY ID (ADMIN)
========================= */
export async function adminGetCourseById(req: Request, res: Response) {
  try {
    const doc = await CourseModel.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

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

/* =========================
   GET COURSE BY SLUG (PUBLIC)
========================= */
export async function getPublishedCourseBySlug(req: Request, res: Response) {
  try {
    const doc = await CourseModel.findOne({
      slug: req.params.slug,
      isPublished: true,
    });

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

/* =========================
   UPDATE COURSE
========================= */
export async function updateCourse(req: Request, res: Response) {
  try {
    const existing = await CourseModel.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let nextSlug = existing.slug;

    if (req.body.slug || req.body.title) {
      nextSlug = normalizeSlug(req.body.slug || req.body.title || existing.title);

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

    const nextIsPublished = toBool(req.body.isPublished, existing.isPublished);

    const payload: Record<string, any> = {
      ...(req.body.title !== undefined ? { title: String(req.body.title).trim() } : {}),
      slug: nextSlug,

      ...(req.body.category !== undefined ? { category: req.body.category } : {}),
      ...(req.body.shortDesc !== undefined ? { shortDesc: req.body.shortDesc } : {}),
      ...(req.body.description !== undefined ? { description: req.body.description } : {}),
      ...(req.body.overview !== undefined ? { overview: req.body.overview } : {}),

      ...(req.body.coverImage !== undefined
        ? { coverImage: parseObject(req.body.coverImage, null as any) }
        : {}),
      ...(req.body.galleryImages !== undefined
        ? { galleryImages: parseArray(req.body.galleryImages) }
        : {}),

      ...(req.body.duration !== undefined ? { duration: req.body.duration } : {}),
      ...(req.body.modulesCount !== undefined ? { modulesCount: req.body.modulesCount } : {}),
      ...(req.body.rating !== undefined ? { rating: Number(req.body.rating) || 0 } : {}),

      ...(req.body.sessionDuration !== undefined
        ? { sessionDuration: req.body.sessionDuration }
        : {}),
      ...(req.body.classSchedule !== undefined
        ? { classSchedule: req.body.classSchedule }
        : {}),
      ...(req.body.mode !== undefined ? { mode: req.body.mode } : {}),
      ...(req.body.enrolled !== undefined ? { enrolled: req.body.enrolled } : {}),
      ...(req.body.batchSize !== undefined ? { batchSize: req.body.batchSize } : {}),
      ...(req.body.admissionFee !== undefined
        ? {
            admissionFee:
              req.body.admissionFee === "" || req.body.admissionFee == null
                ? null
                : Number(req.body.admissionFee),
          }
        : {}),
      ...(req.body.placementSupport !== undefined
        ? { placementSupport: toBool(req.body.placementSupport, true) }
        : {}),

      ...(req.body.features !== undefined
        ? { features: parseArray<string>(req.body.features) }
        : {}),
      ...(req.body.support !== undefined
        ? { support: parseArray<string>(req.body.support) }
        : {}),
      ...(req.body.curriculum !== undefined
        ? { curriculum: parseArray(req.body.curriculum) }
        : {}),
      ...(req.body.trainers !== undefined
        ? { trainers: parseArray(req.body.trainers) }
        : {}),
      ...(req.body.reviews !== undefined
        ? { reviews: parseArray(req.body.reviews) }
        : {}),

      ...(req.body.seo !== undefined ? { seo: parseObject(req.body.seo, {}) } : {}),

      ...(req.body.isFeatured !== undefined
        ? { isFeatured: toBool(req.body.isFeatured, false) }
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

/* =========================
   DELETE COURSE
========================= */
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