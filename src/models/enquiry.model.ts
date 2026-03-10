// src/models/enquiry.model.ts
import { Document, Schema, model } from "mongoose";

export type EnquiryStatus = "NEW" | "IN_PROGRESS" | "CLOSED";

export interface IEnquiry extends Document {
  full_name: string;
  email: string;
  mobile: string;
  qualification?: string | null;
  background?: string | null;
  current_location?: string | null;
  interested_course?: string | null;
  subject?: string | null;
  message?: string | null;
  source?: string | null;
  status: EnquiryStatus;
  created_at: Date;
  updated_at: Date;
}

const enquirySchema = new Schema<IEnquiry>(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    qualification: {
      type: String,
      default: null,
      trim: true,
    },
    background: {
      type: String,
      default: null,
      trim: true,
    },
    current_location: {
      type: String,
      default: null,
      trim: true,
    },
    interested_course: {
      type: String,
      default: null,
      trim: true,
    },
    subject: {
      type: String,
      default: null,
      trim: true,
    },
    message: {
      type: String,
      default: null,
      trim: true,
    },
    source: {
      type: String,
      default: "website",
      trim: true,
    },
    status: {
      type: String,
      enum: ["NEW", "IN_PROGRESS", "CLOSED"],
      default: "NEW",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export const EnquiryModel = model<IEnquiry>("Enquiry", enquirySchema);