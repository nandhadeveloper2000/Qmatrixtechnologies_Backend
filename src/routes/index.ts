import { Router } from "express";
import auth from "./auth.routes";
import enquiries from "./enquiry.routes";
import users from "./user.routes";
import blogs from "./blog.routes";
import courses from "./course.routes";
const router = Router();
router.use("/auth", auth);
router.use("/enquiries", enquiries);
router.use("/users", users);
router.use("/blogs", blogs);
router.use("/courses", courses);

export default router;