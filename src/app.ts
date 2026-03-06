import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { env } from "./config/env";

export const app = express();

const allowedOrigins = env.FRONTEND_URLS.split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(hpp());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", routes);

app.use((_req, res) =>
  res.status(404).json({ success: false, message: "Route not found" })
);