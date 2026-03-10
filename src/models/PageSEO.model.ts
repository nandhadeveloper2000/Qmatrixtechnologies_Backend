import mongoose, { Document, Schema } from "mongoose";

export interface IPageSEO extends Document {
  pageKey: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  robots?: string;
  schemaType?: "WebPage" | "Article" | "Course" | "FAQPage";
  createdAt: Date;
  updatedAt: Date;
}

const PageSEOSchema = new Schema<IPageSEO>(
  {
    pageKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    metaTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 70,
    },
    metaDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 170,
    },
    keywords: {
      type: [String],
      default: [],
      set: (arr: string[]) =>
        Array.isArray(arr)
          ? arr.map((item) => String(item).trim()).filter(Boolean)
          : [],
    },
    canonicalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    ogTitle: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    ogDescription: {
      type: String,
      default: "",
      trim: true,
      maxlength: 220,
    },
    ogImage: {
      type: String,
      default: "",
      trim: true,
    },
    robots: {
      type: String,
      default: "index,follow",
      trim: true,
    },
    schemaType: {
      type: String,
      enum: ["WebPage", "Article", "Course", "FAQPage"],
      default: "WebPage",
      trim: true,
    },
  },
  { timestamps: true }
);

const PageSEO =
  mongoose.models.PageSEO ||
  mongoose.model<IPageSEO>("PageSEO", PageSEOSchema);

export default PageSEO;