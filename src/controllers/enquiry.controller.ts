import { Request, Response } from "express";
import { EnquiryModel } from "../models/enquiry.model";

type EnquiryStatus = "NEW" | "IN_PROGRESS" | "COMPLETED";

function sanitizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown): string {
  return sanitizeString(value).toLowerCase();
}

function normalizeMobile(value: unknown): string {
  return sanitizeString(value).replace(/\s+/g, "");
}

function normalizeCourse(value: unknown): string {
  return sanitizeString(value);
}

function uniqueStringArray(values: unknown[]): string[] {
  return [
    ...new Set(
      values
        .map((value) => sanitizeString(value))
        .filter(Boolean)
    ),
  ];
}

function isValidStatus(value: unknown): value is EnquiryStatus {
  return ["NEW", "IN_PROGRESS", "COMPLETED"].includes(String(value));
}

function pickLatestNonEmpty(...values: unknown[]): string | null {
  for (let i = values.length - 1; i >= 0; i -= 1) {
    const value = sanitizeString(values[i]);
    if (value) return value;
  }
  return null;
}

/**
 * POST /api/enquiries
 * Creates a new enquiry or updates an existing one if email/mobile already exists.
 * Duplicate-safe course support:
 * - same email/mobile => same lead
 * - new course => appended to interested_courses[]
 * - repeated course => ignored
 */
export async function createEnquiry(req: Request, res: Response) {
  try {
    const body = req.body ?? {};

    const payload = {
      full_name: sanitizeString(body.full_name),
      email: normalizeEmail(body.email),
      mobile: normalizeMobile(body.mobile),
      qualification: sanitizeString(body.qualification) || null,
      background: sanitizeString(body.background) || null,
      current_location: sanitizeString(body.current_location) || null,
      interested_course: normalizeCourse(body.interested_course) || null,
      subject: sanitizeString(body.subject) || null,
      message: sanitizeString(body.message) || null,
      source: sanitizeString(body.source) || "website",
      status: "NEW" as EnquiryStatus,
    };

    if (!payload.full_name || !payload.email || !payload.mobile) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and mobile are required.",
      });
    }

    const existing = await EnquiryModel.findOne({
      $or: [{ email: payload.email }, { mobile: payload.mobile }],
    });

    if (existing) {
      existing.full_name = payload.full_name || existing.full_name;
      existing.email = payload.email || existing.email;
      existing.mobile = payload.mobile || existing.mobile;
      existing.qualification = payload.qualification ?? existing.qualification;
      existing.background = payload.background ?? existing.background;
      existing.current_location =
        payload.current_location ?? existing.current_location;
      existing.subject = payload.subject ?? existing.subject;
      existing.message = payload.message ?? existing.message;
      existing.source = payload.source || existing.source;

      const mergedCourses = uniqueStringArray([
        ...(Array.isArray(existing.interested_courses)
          ? existing.interested_courses
          : []),
        existing.interested_course,
        payload.interested_course,
      ]);

      existing.interested_courses = mergedCourses;
      existing.interested_course =
        payload.interested_course || existing.interested_course || null;
      existing.last_interested_course =
        payload.interested_course ||
        pickLatestNonEmpty(
          existing.last_interested_course,
          existing.interested_course,
          mergedCourses[mergedCourses.length - 1]
        );

      existing.enquiry_count = Math.max(
        1,
        Number(existing.enquiry_count || 1) + 1
      );
      existing.last_enquired_at = new Date();

      // Re-open completed lead if user enquires again
      if (existing.status === "COMPLETED") {
        existing.status = "NEW";
      }

      await existing.save();

      return res.status(200).json({
        success: true,
        updated: true,
        message: "Existing enquiry updated successfully.",
        data: existing,
      });
    }

    const interestedCourses = payload.interested_course
      ? uniqueStringArray([payload.interested_course])
      : [];

    const doc = await EnquiryModel.create({
      ...payload,
      interested_courses: interestedCourses,
      last_interested_course: payload.interested_course || null,
      enquiry_count: 1,
      last_enquired_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      created: true,
      message: "Enquiry submitted successfully.",
      data: doc,
    });
  } catch (error: any) {
    console.error("createEnquiry error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to create enquiry.",
    });
  }
}

/**
 * GET /api/enquiries?page=1&limit=20&q=&status=
 * Supports search across person + course fields.
 */
export async function listEnquiries(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const q = sanitizeString(req.query.q);
    const status = sanitizeString(req.query.status);

    const filter: Record<string, any> = {};

    if (q) {
      filter.$or = [
        { full_name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { mobile: { $regex: q, $options: "i" } },
        { interested_course: { $regex: q, $options: "i" } },
        { interested_courses: { $elemMatch: { $regex: q, $options: "i" } } },
        { current_location: { $regex: q, $options: "i" } },
        { source: { $regex: q, $options: "i" } },
      ];
    }

    if (status && isValidStatus(status)) {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      EnquiryModel.find(filter)
        .sort({ updated_at: -1, created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EnquiryModel.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("listEnquiries error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch enquiries.",
    });
  }
}

/**
 * GET /api/enquiries/:id
 * Fetch single enquiry detail
 */
export async function getEnquiryById(req: Request, res: Response) {
  try {
    const doc = await EnquiryModel.findById(req.params.id).lean();

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    return res.json({
      success: true,
      data: doc,
    });
  } catch (error: any) {
    console.error("getEnquiryById error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch enquiry.",
    });
  }
}

/**
 * PATCH /api/enquiries/:id
 * Supports:
 * - status update to NEW / IN_PROGRESS / COMPLETED
 * - course merge into interested_courses[]
 * - safe partial update
 */
export async function updateEnquiry(req: Request, res: Response) {
  try {
    const body = req.body ?? {};

    const doc = await EnquiryModel.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    const full_name = sanitizeString(body.full_name);
    const email = normalizeEmail(body.email);
    const mobile = normalizeMobile(body.mobile);
    const qualification = sanitizeString(body.qualification);
    const background = sanitizeString(body.background);
    const current_location = sanitizeString(body.current_location);
    const interested_course = normalizeCourse(body.interested_course);
    const subject = sanitizeString(body.subject);
    const message = sanitizeString(body.message);
    const source = sanitizeString(body.source);
    const status = sanitizeString(body.status);

    if (status && !isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Allowed: NEW, IN_PROGRESS, COMPLETED.",
      });
    }

    if (email && email !== doc.email) {
      const duplicateByEmail = await EnquiryModel.findOne({
        _id: { $ne: doc._id },
        email,
      }).lean();

      if (duplicateByEmail) {
        return res.status(409).json({
          success: false,
          message: "Another enquiry already exists with this email.",
        });
      }
    }

    if (mobile && mobile !== doc.mobile) {
      const duplicateByMobile = await EnquiryModel.findOne({
        _id: { $ne: doc._id },
        mobile,
      }).lean();

      if (duplicateByMobile) {
        return res.status(409).json({
          success: false,
          message: "Another enquiry already exists with this mobile number.",
        });
      }
    }

    if (full_name) doc.full_name = full_name;
    if (email) doc.email = email;
    if (mobile) doc.mobile = mobile;
    if (qualification) doc.qualification = qualification;
    if (background) doc.background = background;
    if (current_location) doc.current_location = current_location;
    if (subject) doc.subject = subject;
    if (message) doc.message = message;
    if (source) doc.source = source;
    if (status) doc.status = status as EnquiryStatus;

    if (interested_course) {
      const mergedCourses = uniqueStringArray([
        ...(Array.isArray(doc.interested_courses) ? doc.interested_courses : []),
        doc.interested_course,
        doc.last_interested_course,
        interested_course,
      ]);

      doc.interested_courses = mergedCourses;
      doc.interested_course = interested_course;
      doc.last_interested_course = interested_course;
      doc.last_enquired_at = new Date();
    } else {
      // normalize old data even if no new course is passed
      doc.interested_courses = uniqueStringArray([
        ...(Array.isArray(doc.interested_courses) ? doc.interested_courses : []),
        doc.interested_course,
        doc.last_interested_course,
      ]);

      if (!doc.last_interested_course && doc.interested_courses.length) {
        doc.last_interested_course =
          doc.interested_courses[doc.interested_courses.length - 1];
      }
    }

    if (!doc.enquiry_count || Number(doc.enquiry_count) < 1) {
      doc.enquiry_count = 1;
    }

    await doc.save();

    return res.json({
      success: true,
      message: "Enquiry updated successfully.",
      data: doc,
    });
  } catch (error: any) {
    console.error("updateEnquiry error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to update enquiry.",
    });
  }
}

/**
 * DELETE /api/enquiries/:id
 */
export async function deleteEnquiry(req: Request, res: Response) {
  try {
    const doc = await EnquiryModel.findByIdAndDelete(req.params.id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

    return res.json({
      success: true,
      message: "Enquiry deleted successfully.",
    });
  } catch (error: any) {
    console.error("deleteEnquiry error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete enquiry.",
    });
  }
}