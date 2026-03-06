import { Schema, model, Types } from "mongoose";

const FaqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    public_id: { type: String, default: null },
    alt: { type: String, default: "" },
  },
  { _id: false }
);

const BlogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    excerpt: { type: String, default: "" },
    contentHtml: { type: String, required: true },

    category: { type: String, default: "General" },
    tags: { type: [String], default: [] },

    coverImage: { type: ImageSchema, default: null },

    authorName: { type: String, default: "" },
    location: { type: String, default: "" },
    readTime: { type: Number, default: 5 },
    views: { type: Number, default: 0 },

    faqs: { type: [FaqSchema], default: [] },

    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },

    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const BlogModel = model("Blog", BlogSchema);