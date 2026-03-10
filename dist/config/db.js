"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const isCloudRun = !!process.env.K_SERVICE; // Cloud Run sets K_SERVICE
const instanceConnName = process.env.CLOUDSQL_INSTANCE_CONNECTION_NAME;
exports.db = promise_1.default.createPool(isCloudRun
    ? {
        // ✅ Cloud Run → Cloud SQL via Unix socket (secure, no public IP needed)
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        socketPath: `/cloudsql/${instanceConnName}`,
        waitForConnections: true,
        connectionLimit: 10,
        connectTimeout: 20000,
    }
    : {
        // ✅ Local dev → Cloud SQL Public IP (temporary)
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        connectTimeout: 20000,
        ssl: { rejectUnauthorized: false }, // ok for public ip
    });
