import { Document, Schema, model } from "mongoose";

export type EnquiryStatus = "NEW" | "IN_PROGRESS" | "COMPLETED";

export interface IEnquiry extends Document {
  full_name: string;
  email: string;
  mobile: string;
  qualification?: string | null;
  background?: string | null;
  current_location?: string | null;
  interested_course?: string | null;
  interested_courses: string[];
  last_interested_course?: string | null;
  subject?: string | null;
  message?: string | null;
  source?: string | null;
  status: EnquiryStatus;
  enquiry_count: number;
  last_enquired_at?: Date | null;
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
      index: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      index: true,
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
    interested_courses: {
      type: [String],
      default: [],
    },
    last_interested_course: {
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
      enum: ["NEW", "IN_PROGRESS", "COMPLETED"],
      default: "NEW",
    },
    enquiry_count: {
      type: Number,
      default: 1,
    },
    last_enquired_at: {
      type: Date,
      default: Date.now,
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