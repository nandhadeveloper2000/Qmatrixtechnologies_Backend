import { Schema, model } from "mongoose";

const EnquirySchema = new Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    mobile: { type: String, required: true },
    qualification: { type: String, default: null },
    background: { type: String, default: null },
    current_location: { type: String, default: null },
    interested_course: { type: String, default: null },
    subject: { type: String, default: null },
    message: { type: String, default: null },
    source: { type: String, default: "website" },

    status: { type: String, enum: ["NEW", "IN_PROGRESS", "CLOSED"], default: "NEW" }
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export const EnquiryModel = model("Enquiry", EnquirySchema);