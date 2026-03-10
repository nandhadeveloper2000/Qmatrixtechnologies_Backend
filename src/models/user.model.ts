import { Schema, model, Types, type Model, type HydratedDocument } from "mongoose";

export type UserRole = "ADMIN" | "EDITOR" | "USER";

export interface IUser {
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  refresh_token_hash?: string | null;
  token_version: number;
  created_by?: Types.ObjectId | null;

  avatar_url?: string | null;
  avatar_public_id?: string | null;

  created_at?: Date;
  updated_at?: Date;
}

export type UserDoc = HydratedDocument<IUser>;

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "EDITOR", "USER"], default: "USER" },
    is_active: { type: Boolean, default: true },
    refresh_token_hash: { type: String, default: null },
    token_version: { type: Number, default: 0 },
    created_by: { type: Types.ObjectId, ref: "User", default: null },

    avatar_url: { type: String, default: null },
    avatar_public_id: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const UserModel: Model<IUser> = model<IUser>("User", UserSchema);