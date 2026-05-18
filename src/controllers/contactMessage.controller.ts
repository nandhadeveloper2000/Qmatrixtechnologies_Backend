import { Request, Response } from "express";
import { env } from "../config/env";
import {
  ContactMessageModel,
  type ContactStatus,
  type IContactMessage,
} from "../models/contactMessage.model";
import {
  sendAdminReplyEmail,
  sendContactAdminNotification,
  sendContactAutoReply,
} from "../config/contactMailer";
import {
  hasUrlLikeContent,
  isLikelySpamText,
  isSubmissionTooFast,
  isValidCountryCode,
  isValidEmail,
  isValidMessage,
  isValidName,
  isValidPhone,
  normalizeCountryCode,
  normalizeEmail,
  normalizePhone,
  sanitizeText,
} from "../utils/contactValidation";

type ContactSummary = {
  total: number;
  new: number;
  in_progress: number;
  completed: number;
  closed: number;
};

function getErrorMessage(error: unknown) {
  if (env.NODE_ENV !== "production" && error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildEmptySummary(total = 0): ContactSummary {
  return {
    total,
    new: 0,
    in_progress: 0,
    completed: 0,
    closed: 0,
  };
}

function buildSummary(
  total: number,
  grouped: Array<{ _id: ContactStatus; count: number }>
): ContactSummary {
  const summary = buildEmptySummary(total);

  for (const item of grouped) {
    if (item._id in summary) {
      summary[item._id] = Number(item.count || 0);
    }
  }

  return summary;
}

export async function createContactMessage(req: Request, res: Response) {
  try {
    const website = sanitizeText(req.body.website);
    const formStartedAt = req.body.formStartedAt;
    const firstName = sanitizeText(req.body.firstName);
    const lastName = sanitizeText(req.body.lastName);
    const email = normalizeEmail(req.body.email);
    const countryCode = normalizeCountryCode(req.body.countryCode || "+91");
    const phone = normalizePhone(req.body.phone);
    const message = sanitizeText(req.body.message);

    if (website) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission",
      });
    }

    if (isSubmissionTooFast(formStartedAt)) {
      return res.status(400).json({
        success: false,
        message: "Please take a moment to complete the form before submitting.",
      });
    }

    if (!firstName || !isValidName(firstName) || isLikelySpamText(firstName)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid first name using letters only.",
      });
    }

    if (lastName && (!isValidName(lastName) || isLikelySpamText(lastName))) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid last name using letters only.",
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Valid email is required",
      });
    }

    if (!countryCode || !isValidCountryCode(countryCode)) {
      return res.status(400).json({
        success: false,
        message: "Valid country code is required",
      });
    }

    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Valid phone number is required",
      });
    }

    if (
      !message ||
      !isValidMessage(message) ||
      hasUrlLikeContent(message)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a clear message with at least 10 characters and no links.",
      });
    }

    const duplicateThreshold = new Date(Date.now() - 10 * 60 * 1000);
    const recentDuplicate = await ContactMessageModel.findOne({
      email,
      phone,
      message,
      createdAt: { $gte: duplicateThreshold },
    }).lean();

    if (recentDuplicate) {
      return res.status(429).json({
        success: false,
        message:
          "We already received this message recently. Please wait a few minutes before trying again.",
      });
    }

    const contact = await ContactMessageModel.create({
      firstName,
      lastName,
      email,
      countryCode,
      phone,
      message,
      status: "new",
      reason: "",
    });

    try {
      await sendContactAdminNotification({
        firstName,
        lastName,
        email,
        countryCode,
        phone,
        message,
      });

      await sendContactAutoReply({
        to: email,
        firstName,
      });
    } catch (mailError) {
      console.error("Contact email send failed:", mailError);
    }

    return res.status(201).json({
      success: true,
      message: "Your message has been received successfully",
      data: contact,
    });
  } catch (error) {
    console.error("createContactMessage error:", error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

export async function getAllContactMessages(req: Request, res: Response) {
  try {
    const rawStatus = sanitizeText(req.query.status);
    const search = sanitizeText(req.query.search);
    const page = Math.max(Number(req.query.page || 1) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const allowedStatuses: ContactStatus[] = [
      "new",
      "in_progress",
      "completed",
      "closed",
    ];

    if (rawStatus && !allowedStatuses.includes(rawStatus as ContactStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status filter",
      });
    }

    const query: Record<string, unknown> = {};

    if (rawStatus) {
      query.status = rawStatus as ContactStatus;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");

      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
        { message: regex },
      ];
    }

    const [items, total, grouped] = await Promise.all([
      ContactMessageModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ContactMessageModel.countDocuments(query),
      ContactMessageModel.aggregate<{ _id: ContactStatus; count: number }>([
        { $match: query },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const summary = buildSummary(total, grouped);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
      summary,
    });
  } catch (error) {
    console.error("getAllContactMessages error:", error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error),
      summary: buildEmptySummary(),
    });
  }
}

export async function getContactMessageById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const item = await ContactMessageModel.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("getContactMessageById error:", error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

export async function updateContactStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const status = sanitizeText(req.body.status);
    const reason = sanitizeText(req.body.reason);

    const allowedStatuses: ContactStatus[] = [
      "new",
      "in_progress",
      "completed",
      "closed",
    ];

    if (!allowedStatuses.includes(status as ContactStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updated = await ContactMessageModel.findByIdAndUpdate(
      id,
      {
        status,
        reason,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateContactStatus error:", error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}

export async function replyToContactMessage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const replyMessage = sanitizeText(req.body.replyMessage);
    const status = sanitizeText(req.body.status || "completed");
    const reason = sanitizeText(req.body.reason);
    const allowedStatuses: ContactStatus[] = [
      "new",
      "in_progress",
      "completed",
      "closed",
    ];

    if (!replyMessage || replyMessage.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Reply message must be at least 10 characters",
      });
    }

    const item = await ContactMessageModel.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    await sendAdminReplyEmail({
      to: item.email,
      firstName: item.firstName,
      replyMessage,
    });

    item.adminReply = replyMessage;
    item.status = allowedStatuses.includes(status as ContactStatus)
      ? (status as ContactStatus)
      : "completed";
    item.reason = reason;
    item.repliedAt = new Date();

    await item.save();

    return res.status(200).json({
      success: true,
      message: "Reply sent successfully",
      data: item,
    });
  } catch (error) {
    console.error("replyToContactMessage error:", error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
}
