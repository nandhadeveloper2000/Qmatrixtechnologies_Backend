import { Request, Response } from "express";
import { normEmail } from "../utils/normalize";
import { UserModel, type UserRole } from "../models/user.model";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload";
import { cloudinary } from "../config/cloudinary";

const USER_ROLES: UserRole[] = ["ADMIN", "EDITOR", "USER"];

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}


export async function adminListUsers(req: Request, res: Response) {
  try {
    const q = String(req.query.q || "").trim();

    const filter = q
      ? {
          $or: [
            { email: new RegExp(q, "i") },
            { name: new RegExp(q, "i") },
          ],
        }
      : {};

    const items = await UserModel.find(filter).sort({ created_at: -1 });

    return res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("adminListUsers error:", error);
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
    const roleRaw = req.body?.role;
    const is_active =
      typeof req.body?.is_active === "boolean" ? req.body.is_active : true;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: "email & name required",
      });
    }

    const role: UserRole = isUserRole(roleRaw) ? roleRaw : "ADMIN";

    const exists = await UserModel.findOne({ email });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const doc = await UserModel.create({
      email,
      name,
      role,
      is_active,
      created_by: req.user?.uid || null,
    });

    return res.status(201).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error("adminCreateUser error:", error);
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

    if (isUserRole(req.body?.role)) {
      update.role = req.body.role;
    }

    if (typeof req.body?.is_active === "boolean") {
      update.is_active = req.body.is_active;
    }

    const doc = await UserModel.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    return res.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error("adminUpdateUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
}
export async function adminDeleteUser(req: Request, res: Response) {
  try {
    const doc = await UserModel.findById(req.params.id);

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
  } catch (error) {
    console.error("adminDeleteUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const user = await UserModel.findById(req.params.id).select(
      "_id email name role is_active avatar_url avatar_public_id created_at updated_at"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        avatar_url: user.avatar_url ?? null,
        avatar_public_id: user.avatar_public_id ?? null,
        created_at: user.created_at ?? null,
        updated_at: user.updated_at ?? null,
      },
    });
  } catch (error) {
    console.error("getUserById error:", error);
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

    const user = await UserModel.findById(userId).select(
      "_id email name role is_active avatar_url avatar_public_id created_at updated_at"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        avatar_url: user.avatar_url ?? null,
        avatar_public_id: user.avatar_public_id ?? null,
        created_at: user.created_at ?? null,
        updated_at: user.updated_at ?? null,
      },
    });
  } catch (error) {
    console.error("getMyProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
}


export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = req.params.id;
    const body = req.body as {
      name?: unknown;
      role?: unknown;
      is_active?: unknown;
    };

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (typeof body.name === "string" && body.name.trim()) {
      user.name = body.name.trim();
    }

    if (isUserRole(body.role)) {
      user.role = body.role;
    }

    if (typeof body.is_active === "boolean") {
      user.is_active = body.is_active;
    }

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        avatar_url: user.avatar_url ?? null,
        avatar_public_id: user.avatar_public_id ?? null,
      },
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
}

export async function uploadAvatar(req: Request, res: Response) {
  try {
    const userId = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Avatar image is required",
      });
    }

    const user = await UserModel.findById(userId);
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
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        avatar_url: user.avatar_url,
        avatar_public_id: user.avatar_public_id,
      },
    });
  } catch (error) {
    console.error("uploadAvatar error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload avatar",
    });
  }
}

export async function deleteAvatar(req: Request, res: Response) {
  try {
    const userId = req.params.id;

    const user = await UserModel.findById(userId);
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
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
        avatar_url: null,
        avatar_public_id: null,
      },
    });
  } catch (error) {
    console.error("deleteAvatar error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete avatar",
    });
  }
}