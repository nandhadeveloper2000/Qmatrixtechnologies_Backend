import { Router } from "express";

import authRoutes from "./auth.routes";
import enquiriesRoutes from "./enquiries.routes";
import adminRoutes from "./adminUsers.routes";

const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/enquiries", enquiriesRoutes);
routes.use("/admin", adminRoutes);
export default routes;