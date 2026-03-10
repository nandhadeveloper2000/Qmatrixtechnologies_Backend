    import { Router } from "express";
    import auth from "./auth.routes";
    import enquiries from "./enquiry.routes";
    import users from "./user.routes";
    import blogs from "./blog.routes";
    import courses from "./course.routes";
    import Admin from "./admin.routes";
    import pageSeo from "./pageSeo.routes";

    
    const router = Router();
    router.use("/auth", auth);
    router.use("/enquiries", enquiries);
    router.use("/users", users);
    router.use("/blogs", blogs);
    router.use("/courses", courses);
    router.use("/admin",Admin);
    router.use("/page-seo", pageSeo);

    export default router;      