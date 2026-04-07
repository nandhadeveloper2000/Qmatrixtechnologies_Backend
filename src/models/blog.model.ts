import mongoose, { Schema, model, Types } from "mongoose";

export type SeoRobots =
  | "index,follow"
  | "noindex,follow"
  | "index,nofollow"
  | "noindex,nofollow";

export type SeoSchemaType = "Article";

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

const BlogPointSchema = new Schema(
  {
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const BlogSubpointSchema = new Schema(
  {
    subtitle: { type: String, default: "", trim: true },
    subdescription: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const BlogSectionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    subpoints: { type: [BlogSubpointSchema], default: [] },
    image: { type: ImageSchema, default: null },
    points: { type: [BlogPointSchema], default: [] },
  },
  { _id: false }
);

const BlogSeoSchema = new Schema(
  {
    metaTitle: {
      type: String,
      default: "",
      trim: true,
      maxlength: 70,
    },
    metaDescription: {
      type: String,
      default: "",
      trim: true,
      maxlength: 170,
    },
    keywords: {
      type: [String],
      default: [],
    },
    canonicalUrl: {
      type: String,
      default: "",
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
      type: ImageSchema,
      default: null,
    },
    robots: {
      type: String,
      enum: [
        "index,follow",
        "noindex,follow",
        "index,nofollow",
        "noindex,nofollow",
      ],
      default: "index,follow",
    },
    schemaType: {
      type: String,
      enum: ["Article"],
      default: "Article",
    },
  },
  { _id: false }
);

const BlogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },

    excerpt: { type: String, default: "", trim: true },

    introTitle: { type: String, default: "", trim: true },
    introDescription: { type: String, default: "", trim: true },

    category: { type: String, default: "General", trim: true },
    tags: { type: [String], default: [] },

    coverImage: { type: ImageSchema, default: null },

    authorName: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    readTime: { type: Number, default: 5 },
    views: { type: Number, default: 0 },

    sections: { type: [BlogSectionSchema], default: [] },
    faqs: { type: [FaqSchema], default: [] },

    seo: {
      type: BlogSeoSchema,
      default: () => ({
        metaTitle: "",
        metaDescription: "",
        keywords: [],
        canonicalUrl: "",
        ogTitle: "",
        ogDescription: "",
        ogImage: null,
        robots: "index,follow",
        schemaType: "Article",
      }),
    },

    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null },

    createdBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false }
);

BlogSchema.index({ createdAt: -1 });
BlogSchema.index({ publishedAt: -1 });
BlogSchema.index({ isPublished: 1, createdAt: -1 });
BlogSchema.index({ "seo.metaTitle": 1 });

export const BlogModel =
  mongoose.models.Blog || model("Blog", BlogSchema);