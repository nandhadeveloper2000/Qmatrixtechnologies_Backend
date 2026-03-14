import mongoose, { Schema, model, Types, type HydratedDocument } from "mongoose";

export type UserRole = "ADMIN" | "EDITOR" | "USER";

export type CourseCategory = "New One" | "Recommended" | "Most Placed";

export type CourseMode = "Online" | "Offline" | "Online/Offline";

export interface ICourseImage {
  url: string;
  public_id?: string | null;
  alt?: string;
}

export interface ICourseModule {
  title: string;
  topics: string[];
}

export interface ICourseFeature {
  title: string;
  description: string;
}

export interface ICourseInterviewQuestion {
  question: string;
  answer: string;
}

export interface ICourseFaq {
  question: string;
  answer: string;
}

export interface ICourse {
  title: string;
  slug: string;
  category?: CourseCategory;

  description?: string;

  coverImage?: ICourseImage | null;
  galleryImages?: ICourseImage[];

  duration?: string;
  modulesCount?: string;
  rating?: number;

  sessionDuration?: string;
  classSchedule?: string;
  mode?: CourseMode;
  enrolled?: string;
  placementSupport?: boolean;

  whatYouWillLearn?: string[];
  features?: ICourseFeature[];
  supportAndCareer?: string[];
  curriculum?: ICourseModule[];

  interviewQuestions?: ICourseInterviewQuestion[];
  faq?: ICourseFaq[];

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
    topics: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => Array.isArray(arr),
        message: "Topics must be an array of strings",
      },
    },
  },
  { _id: false }
);

const CourseFeatureSchema = new Schema<ICourseFeature>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const CourseInterviewQuestionSchema = new Schema<ICourseInterviewQuestion>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const CourseFaqSchema = new Schema<ICourseFaq>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },

    category: {
      type: String,
      enum: ["New One", "Recommended", "Most Placed"],
      default: "New One",
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    coverImage: {
      type: CourseImageSchema,
      default: null,
    },

    galleryImages: {
      type: [CourseImageSchema],
      default: [],
    },

    duration: {
      type: String,
      default: "",
      trim: true,
    },

    modulesCount: {
      type: String,
      default: "",
      trim: true,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    sessionDuration: {
      type: String,
      default: "",
      trim: true,
    },

    classSchedule: {
      type: String,
      default: "",
      trim: true,
    },

    mode: {
      type: String,
      enum: ["Online", "Offline", "Online/Offline"],
      default: "Online/Offline",
    },

    enrolled: {
      type: String,
      default: "",
      trim: true,
    },

    placementSupport: {
      type: Boolean,
      default: true,
    },

    whatYouWillLearn: {
      type: [String],
      default: [],
    },

    features: {
      type: [CourseFeatureSchema],
      default: [],
    },

    supportAndCareer: {
      type: [String],
      default: [],
    },

    curriculum: {
      type: [CourseModuleSchema],
      default: [],
    },

    interviewQuestions: {
      type: [CourseInterviewQuestionSchema],
      default: [],
    },

    faq: {
      type: [CourseFaqSchema],
      default: [],
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

CourseSchema.index({ title: 1 });
CourseSchema.index({ category: 1, isPublished: 1 });
CourseSchema.index({ isFeatured: 1, isPublished: 1 });
CourseSchema.index({ createdAt: -1 });

export const CourseModel =
  mongoose.models.Course || model<ICourse>("Course", CourseSchema);