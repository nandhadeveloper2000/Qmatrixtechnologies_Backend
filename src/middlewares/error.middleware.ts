import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { ZodError } from "zod";
import { env } from "../config/env";
import ApiError from "../utils/ApiError";

function getMongooseValidationMessage(
  error: mongoose.Error.ValidationError
): string {
  const firstError = Object.values(error.errors)[0];
  return firstError?.message || "Validation failed";
}

function getSafeInternalMessage(message: string) {
  if (env.NODE_ENV === "production") {
    return "Internal server error";
  }

  return message || "Internal server error";
}

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: err.issues[0]?.message || "Validation failed",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Uploaded file exceeds the allowed size limit."
          : err.message,
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      message: getMongooseValidationMessage(err),
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}`,
    });
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  ) {
    const duplicateError = err as {
      keyValue?: Record<string, unknown>;
    };

    const duplicateField = Object.keys(duplicateError.keyValue || {})[0];

    return res.status(409).json({
      success: false,
      message: duplicateField
        ? `${duplicateField} already exists`
        : "Duplicate value error",
    });
  }

  if (err instanceof Error) {
    return res.status(500).json({
      success: false,
      message: getSafeInternalMessage(err.message),
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
