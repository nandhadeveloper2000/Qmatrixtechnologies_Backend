"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const PORT = Number(process.env.PORT || 8080);
async function start() {
    try {
        await db_1.db.query("SELECT 1");
        console.log("✅ MySQL Connected");
        app_1.default.listen(PORT, "0.0.0.0", () => {
            console.log(`✅ Server running on port ${PORT}`);
        });
    }
    catch (err) {
        console.error("❌ DB Connection Failed:", err);
        process.exit(1);
    }
}
start();
