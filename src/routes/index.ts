import { Router } from "express";
import auth            from "./auth.routes";
import enquiries       from "./enquiry.routes";
import users           from "./user.routes";
import blogs           from "./blog.routes";
import courses         from "./course.routes";
import admin           from "./admin.routes";
import pageSeo         from "./pageSeo.routes";
import contact         from "./contactMessage.routes";
import adminUsers      from "./adminUsers.routes";

const router = Router();

router.use("/auth",       auth);
router.use("/enquiries",  enquiries);
router.use("/users",      users);
router.use("/blogs",      blogs);
router.use("/courses",    courses);
router.use("/admin",      admin);
router.use("/admin",      adminUsers);
router.use("/page-seo",   pageSeo);
router.use("/contact",    contact);

export default router;
