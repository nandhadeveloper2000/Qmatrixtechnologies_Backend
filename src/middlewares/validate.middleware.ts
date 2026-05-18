import type { ParamsDictionary, RequestHandler } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import type { ZodTypeAny } from "zod";

type RequestSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body ?? {});
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params ?? {}) as ParamsDictionary;
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query ?? {}) as ParsedQs;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
