import mongoose, { Schema, model, models, InferSchemaType } from "mongoose";

const ROBOTS_VALUES = [
  "index,follow",
  "noindex,follow",
  "index,nofollow",
  "noindex,nofollow",
] as const;

const SCHEMA_TYPES = ["WebPage", "Article", "Course", "FAQPage"] as const;

const isAbsoluteUrl = (value: string) => /^https?:\/\/.+/i.test(value);

const PageSEOSchema = new Schema(
  {
    pageKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 100,
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
      set: (value: unknown) => {
        if (!Array.isArray(value)) return [];
        return value
          .map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 30);
      },
    },

    canonicalUrl: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => isAbsoluteUrl(value),
        message: "canonicalUrl must be a valid absolute URL",
      },
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
      validate: {
        validator: (value: string) => !value || isAbsoluteUrl(value),
        message: "ogImage must be a valid absolute URL",
      },
    },

    robots: {
      type: String,
      enum: ROBOTS_VALUES,
      default: "index,follow",
      trim: true,
    },

    schemaType: {
      type: String,
      enum: SCHEMA_TYPES,
      default: "WebPage",
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

PageSEOSchema.index({ updatedAt: -1 });

export type PageSEOType = InferSchemaType<typeof PageSEOSchema>;

const PageSEO = models.PageSEO || model("PageSEO", PageSEOSchema);

export default PageSEO;