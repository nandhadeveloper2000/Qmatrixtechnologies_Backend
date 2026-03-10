// src/controllers/enquiry.controller.ts
import { Request, Response } from "express";
import { EnquiryModel } from "../models/enquiry.model";

function sanitizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function createEnquiry(req: Request, res: Response) {
  try {
    console.log("HEADERS CONTENT-TYPE:", req.headers["content-type"]);
    console.log("RAW BODY:", req.body);

    const body = req.body ?? {};

    const payload = {
      full_name: sanitizeString(body.full_name),
      email: sanitizeString(body.email).toLowerCase(),
      mobile: sanitizeString(body.mobile),
      qualification: sanitizeString(body.qualification) || null,
      background: sanitizeString(body.background) || null,
      current_location: sanitizeString(body.current_location) || null,
      interested_course: sanitizeString(body.interested_course) || null,
      subject: sanitizeString(body.subject) || null,
      message: sanitizeString(body.message) || null,
      source: sanitizeString(body.source) || "website",
      status: "NEW" as const,
    };

    console.log("SANITIZED PAYLOAD:", payload);

    if (!payload.full_name || !payload.email || !payload.mobile) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and mobile are required.",
      });
    }

    const doc = await EnquiryModel.create(payload);

    return res.status(201).json({
      success: true,
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

export async function listEnquiries(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const skip = (page - 1) * limit;

    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim();

    const filter: Record<string, any> = {};

    if (q) {
      filter.$or = [
        { full_name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { mobile: { $regex: q, $options: "i" } },
        { interested_course: { $regex: q, $options: "i" } },
      ];
    }

    if (status && ["NEW", "IN_PROGRESS", "CLOSED"].includes(status)) {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      EnquiryModel.find(filter)
        .sort({ created_at: -1 })
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

export async function updateEnquiry(req: Request, res: Response) {
  try {
    const body = req.body ?? {};

    const allowedUpdates = {
      full_name: sanitizeString(body.full_name),
      email: sanitizeString(body.email).toLowerCase(),
      mobile: sanitizeString(body.mobile),
      qualification: sanitizeString(body.qualification),
      background: sanitizeString(body.background),
      current_location: sanitizeString(body.current_location),
      interested_course: sanitizeString(body.interested_course),
      subject: sanitizeString(body.subject),
      message: sanitizeString(body.message),
      source: sanitizeString(body.source),
      status: sanitizeString(body.status),
    };

    const updatePayload: Record<string, any> = {};

    Object.entries(allowedUpdates).forEach(([key, value]) => {
      if (value !== "") {
        updatePayload[key] = value;
      }
    });

    if (
      updatePayload.status &&
      !["NEW", "IN_PROGRESS", "CLOSED"].includes(updatePayload.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value.",
      });
    }

    const doc = await EnquiryModel.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found.",
      });
    }

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