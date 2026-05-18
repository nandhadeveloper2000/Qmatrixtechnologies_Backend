import type { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";

export function validateObjectId(paramName = "id"): RequestHandler {
  return (req, res, next) => {
    const value = req.params?.[paramName];

    if (!value || !isValidObjectId(value)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName}`,
      });
    }

    next();
  };
}
