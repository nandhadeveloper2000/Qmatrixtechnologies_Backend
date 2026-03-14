import { Request, Response } from "express";
import { ContactMessageModel } from "../models/contactMessage.model";
import {
  sendAdminReplyEmail,
  sendContactAdminNotification,
  sendContactAutoReply,
} from "../config/contactMailer";
import {
  isValidEmail,
  isValidPhone,
  sanitizeText,
} from "../utils/contactValidation";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export async function createContactMessage(req: Request, res: Response) {
  try {
    const firstName = sanitizeText(req.body.firstName);
    const lastName = sanitizeText(req.body.lastName);
    const email = sanitizeText(req.body.email).toLowerCase();
    const countryCode = sanitizeText(req.body.countryCode || "+91");
    const phone = sanitizeText(req.body.phone);
    const message = sanitizeText(req.body.message);

    if (!firstName) {
      return res.status(400).json({
        success: false,
        message: "First name is required",
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Valid email is required",
      });
    }

    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Valid phone number is required",
      });
    }

    if (!message || message.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Message must be at least 5 characters",
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
    const status = sanitizeText(req.query.status);
    const search = sanitizeText(req.query.search);
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      ContactMessageModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ContactMessageModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getAllContactMessages error:", error);
    return res.status(500).json({
      success: false,
      message: getErrorMessage(error),
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

    const allowedStatuses = ["new", "in_progress", "completed", "closed"];

    if (!allowedStatuses.includes(status)) {
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

    if (!replyMessage) {
      return res.status(400).json({
        success: false,
        message: "Reply message is required",
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
    item.status = ["new", "in_progress", "completed", "closed"].includes(status as any)
      ? (status as any)
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