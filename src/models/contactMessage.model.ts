import mongoose, { Schema, Document, Model } from "mongoose";

export type ContactStatus = "new" | "in_progress" | "completed" | "closed";

export interface IContactMessage extends Document {
  firstName: string;
  lastName?: string;
  email: string;
  countryCode: string;
  phone: string;
  message: string;
  status: ContactStatus;
  reason?: string;
  adminReply?: string;
  repliedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    countryCode: {
      type: String,
      required: true,
      trim: true,
      default: "+91",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "in_progress", "completed", "closed"],
      default: "new",
      index: true,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },
    adminReply: {
      type: String,
      default: "",
      trim: true,
    },
    repliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const ContactMessageModel: Model<IContactMessage> =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);