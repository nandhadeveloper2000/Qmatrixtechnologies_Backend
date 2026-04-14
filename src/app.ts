import express from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { env } from "./config/env";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware";

export const app = express();

const allowedOrigins = (env.FRONTEND_URLS || "")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

console.log("FRONTEND_URLS raw =", env.FRONTEND_URLS);
console.log("allowedOrigins =", allowedOrigins);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.error(`❌ CORS blocked for origin: ${origin}`);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(helmet());
app.use(cors(corsOptions));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(hpp());

app.get("/", (_req, res) => {
  res.send("QMTechnologies API running");
});

app.get("/api/debug/cors", (req, res) => {
  res.json({
    requestOrigin: req.headers.origin || null,
    allowedOrigins,
  });
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);