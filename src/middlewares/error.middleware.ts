import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import ApiError from "../utils/ApiError";

function getMongooseValidationMessage(
  error: mongoose.Error.ValidationError
): string {
  const firstError = Object.values(error.errors)[0];
  return firstError?.message || "Validation failed";
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
  console.error("Global error:", err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
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
      message: `Invalid ${err.path}: ${err.value}`,
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
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}