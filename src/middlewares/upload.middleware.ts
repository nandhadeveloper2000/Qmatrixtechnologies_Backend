import multer from "multer";
import { env } from "../config/env";

const storage = multer.memoryStorage();
const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const upload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, JPEG, PNG, and WEBP image files are allowed.")
      );
    }

    cb(null, true);
  },
});
