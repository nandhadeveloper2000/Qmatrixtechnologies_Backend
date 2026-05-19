import express from "express";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import routes from "./routes";
import { env } from "./config/env";
import { generalApiLimiter } from "./middlewares/rateLimit.middleware";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.NODE_ENV === "production" ? 1 : 0);

const allowedOrigins = env.FRONTEND_ORIGINS;

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", ...allowedOrigins],
        formAction: ["'self'", ...allowedOrigins],
      },
    },
  })
);
app.use(cors(corsOptions));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use((req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = mongoSanitize.sanitize(req.body, {
      replaceWith: "_",
    });
  }

  if (req.params && typeof req.params === "object") {
    req.params = mongoSanitize.sanitize(req.params, {
      replaceWith: "_",
    });
  }

  if (req.query && typeof req.query === "object") {
    const queryObject = req.query as Record<string, unknown>;
    const sanitizedQuery = mongoSanitize.sanitize(
      { ...queryObject },
      { replaceWith: "_" }
    );

    for (const key of Object.keys(queryObject)) {
      delete queryObject[key];
    }

    Object.assign(queryObject, sanitizedQuery);
  }

  next();
});
app.use(hpp());

app.get("/", (_req, res) => {
  res.send("QMTechnologies API running");
});

app.use("/api", generalApiLimiter, routes);

app.use(notFoundHandler);
app.use(errorHandler);
