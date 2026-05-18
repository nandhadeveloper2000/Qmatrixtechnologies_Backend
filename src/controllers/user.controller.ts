import type { Request, Response } from "express";
import { normEmail } from "../utils/normalize";
import { UserModel, type UserDoc, type UserRole } from "../models/user.model";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload";
import { cloudinary } from "../config/cloudinary";
import { hashValue } from "../utils/hash";

const USER_ROLES: UserRole[] = ["ADMIN", "EDITOR", "USER"];
const USER_LIST_FIELDS =
  "_id email name role is_active avatar_url avatar_public_id created_at updated_at";

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

function serializeUser(user: UserDoc) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    is_active: user.is_active,
    avatar_url: user.avatar_url ?? null,
    avatar_public_id: user.avatar_public_id ?? null,
    created_at: user.created_at ?? null,
    updated_at: user.updated_at ?? null,
  };
}

function resolveTargetUserId(req: Request) {
  return req.params.id || req.user?.uid || "";
}

export async function adminListUsers(req: Request, res: Response) {
  try {
    const q = String(req.query.q || "").trim();

    const filter = q
      ? {
          $or: [{ email: new RegExp(q, "i") }, { name: new RegExp(q, "i") }],
        }
      : {};

    const items = await UserModel.find(filter)
      .select(USER_LIST_FIELDS)
      .sort({ created_at: -1 })
      .lean();

    return res.json({
      success: true,
      data: items,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to list users",
    });
  }
}

export async function adminCreateUser(req: Request, res: Response) {
  try {
    const email = normEmail(req.body?.email);
    const name = String(req.body?.name || "").trim();
    const password = String(req.body?.password || "").trim();
    const roleRaw = req.body?.role;
    const is_active =
      typeof req.body?.is_active === "boolean" ? req.body.is_active : true;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: "Email and name are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const role: UserRole = isUserRole(roleRaw) ? roleRaw : "USER";

    const exists = await UserModel.findOne({ email });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const password_hash = await hashValue(password);

    const doc = await UserModel.create({
      email,
      name,
      role,
      is_active,
      password_hash,
      created_by: req.user?.uid || null,
    });

    return res.status(201).json({
      success: true,
      user: serializeUser(doc),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
}

export async function adminUpdateUser(req: Request, res: Response) {
  try {
    const update: Record<string, unknown> = {};

    if (req.body?.email) {
      const email = normEmail(req.body.email);
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Invalid email",
        });
      }

      const existing = await UserModel.findOne({
        email,
        _id: { $ne: req.params.id },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      update.email = email;
    }

    if (typeof req.body?.name === "string" && req.body.name.trim()) {
      update.name = req.body.name.trim();
    }

    if (req.body?.role !== undefined) {
      if (!isUserRole(req.body.role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
      }

      update.role = req.body.role;
    }

    if (typeof req.body?.is_active === "boolean") {
      update.is_active = req.body.is_active;
    }

    const password = String(req.body?.password || "").trim();
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters",
        });
      }

      update.password_hash = await hashValue(password);
    }

    const doc = await UserModel.findById(req.params.id).select(
      USER_LIST_FIELDS + " token_version"
    );

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    if (typeof update.name === "string") doc.name = update.name;
    if (typeof update.email === "string") doc.email = update.email;
    if (typeof update.role === "string" && isUserRole(update.role)) {
      doc.role = update.role;
    }
    if (typeof update.is_active === "boolean") {
      doc.is_active = update.is_active;
    }
    if (typeof update.password_hash === "string") {
      doc.password_hash = update.password_hash;
      doc.refresh_token_hash = null;
      doc.token_version = Number(doc.token_version || 0) + 1;
    }

    await doc.save();

    return res.json({
      success: true,
      user: serializeUser(doc),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
}

export async function adminDeleteUser(req: Request, res: Response) {
  try {
    const doc = await UserModel.findById(req.params.id).select(
      "_id avatar_public_id"
    );

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    if (doc.avatar_public_id) {
      await cloudinary.uploader.destroy(doc.avatar_public_id);
    }

    await doc.deleteOne();

    return res.json({
      success: true,
      message: "Deleted",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const user = await UserModel.findById(req.params.id).select(USER_LIST_FIELDS);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: serializeUser(user),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to get user",
    });
  }
}

export async function getMyProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await UserModel.findById(userId).select(USER_LIST_FIELDS);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: serializeUser(user),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await UserModel.findById(userId).select(USER_LIST_FIELDS);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (typeof req.body?.name === "string" && req.body.name.trim()) {
      user.name = req.body.name.trim();
    }

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: serializeUser(user),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
}

export async function uploadAvatar(req: Request, res: Response) {
  try {
    const userId = resolveTargetUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Avatar image is required",
      });
    }

    const user = await UserModel.findById(userId).select(USER_LIST_FIELDS);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.avatar_public_id) {
      await cloudinary.uploader.destroy(user.avatar_public_id);
    }

    const uploaded = await uploadBufferToCloudinary(
      req.file.buffer,
      "qmtech/users/avatar"
    );

    user.avatar_url = uploaded.secure_url;
    user.avatar_public_id = uploaded.public_id;
    await user.save();

    return res.json({
      success: true,
      message: "Avatar uploaded successfully",
      user: serializeUser(user),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to upload avatar",
    });
  }
}

export async function deleteAvatar(req: Request, res: Response) {
  try {
    const userId = resolveTargetUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await UserModel.findById(userId).select(USER_LIST_FIELDS);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.avatar_public_id) {
      await cloudinary.uploader.destroy(user.avatar_public_id);
    }

    user.avatar_url = null;
    user.avatar_public_id = null;
    await user.save();

    return res.json({
      success: true,
      message: "Avatar deleted successfully",
      user: serializeUser(user),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to delete avatar",
    });
  }
}
