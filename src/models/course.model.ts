import mongoose, { Schema, model, Types, type HydratedDocument } from "mongoose";

export type UserRole = "ADMIN" | "EDITOR" | "USER";

export type CourseCategory =
  | "New One"
  | "Recommended"
  | "Most Placed";

export interface ICourseImage {
  url: string;
  public_id?: string | null;
  alt?: string;
}

export interface ICourseModule {
  title: string;
  topics: string[];
}

export interface ICourseTrainer {
  name: string;
  role?: string;
  bio?: string;
  experience?: string;
  linkedin?: string;
  image?: ICourseImage | null;
}

export interface ICourseReview {
  name: string;
  rating: number;
  comment: string;
  role?: string;
}

export interface ICourse {
  title: string;
  slug: string;
  category?: CourseCategory;

  shortDesc?: string;
  description?: string;
  overview?: string;

  coverImage?: ICourseImage | null;
  galleryImages?: ICourseImage[];

  duration?: string;
  modulesCount?: string;
  rating?: number;

  sessionDuration?: string;
  classSchedule?: string;
  mode?: "Online" | "Offline" | "Online/Offline";
  enrolled?: string;
  batchSize?: string;
  admissionFee?: number | null;
  placementSupport?: boolean;

  features?: string[];
  support?: string[];
  curriculum?: ICourseModule[];
  trainers?: ICourseTrainer[];
  reviews?: ICourseReview[];

  isFeatured?: boolean;
  isPublished: boolean;
  publishedAt?: Date | null;

  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export type CourseDoc = HydratedDocument<ICourse>;

const CourseImageSchema = new Schema<ICourseImage>(
  {
    url: { type: String, required: true, trim: true },
    public_id: { type: String, default: null },
    alt: { type: String, default: "" },
  },
  { _id: false }
);

const CourseModuleSchema = new Schema<ICourseModule>(
  {
    title: { type: String, required: true, trim: true },
    topics: { type: [String], default: [] },
  },
  { _id: false }
);

const CourseTrainerSchema = new Schema<ICourseTrainer>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "" },
    bio: { type: String, default: "" },
    experience: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    image: { type: CourseImageSchema, default: null },
  },
  { _id: false }
);

const CourseReviewSchema = new Schema<ICourseReview>(
  {
    name: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true, trim: true },
    role: { type: String, default: "" },
  },
  { _id: false }
);

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },

    category: {
      type: String,
      enum: ["New One", "Recommended", "Most Placed"],
      default: "New One",
      index: true,
    },

    shortDesc: { type: String, default: "" },
    description: { type: String, default: "" },
    overview: { type: String, default: "" },

    coverImage: { type: CourseImageSchema, default: null },
    galleryImages: { type: [CourseImageSchema], default: [] },

    duration: { type: String, default: "" },
    modulesCount: { type: String, default: "" },
    rating: { type: Number, default: 0 },

    sessionDuration: { type: String, default: "" },
    classSchedule: { type: String, default: "" },
    mode: {
      type: String,
      enum: ["Online", "Offline", "Online/Offline"],
      default: "Online/Offline",
    },
    enrolled: { type: String, default: "" },
    batchSize: { type: String, default: "" },
    admissionFee: { type: Number, default: null },
    placementSupport: { type: Boolean, default: true },

    features: { type: [String], default: [] },
    support: { type: [String], default: [] },
    curriculum: { type: [CourseModuleSchema], default: [] },
    trainers: { type: [CourseTrainerSchema], default: [] },
    reviews: { type: [CourseReviewSchema], default: [] },

    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export const CourseModel =
  mongoose.models.Course || model<ICourse>("Course", CourseSchema);