import { Request, Response } from "express";
import { EnquiryModel } from "../models/enquiry.model";
import { BlogModel } from "../models/blog.model";
import { UserModel } from "../models/user.model";
import { CourseModel } from "../models/course.model";

export async function getAdminDashboard(req: Request, res: Response) {
  try {
    const now = new Date();

    // Today start/end
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );

    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    // Last 7 days
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const [
      totalEnquiries,
      totalBlogs,
      totalUsers,
      totalCourses,
      todayEnquiries,
      weeklyUsers,
      publishedBlogs,
      publishedCourses,
      recentEnquiries,
      recentUsers,
    ] = await Promise.all([
      EnquiryModel.countDocuments(),
      BlogModel.countDocuments(),
      UserModel.countDocuments(),
      CourseModel.countDocuments(),

      EnquiryModel.countDocuments({
        created_at: { $gte: todayStart, $lte: todayEnd },
      }),

      UserModel.countDocuments({
        created_at: { $gte: weekStart },
      }),

      BlogModel.countDocuments({
        isPublished: true,
      }),

      CourseModel.countDocuments({
        isPublished: true,
      }),

      EnquiryModel.find({})
        .sort({ created_at: -1 })
        .limit(5)
        .select("full_name email mobile interested_course status source created_at")
        .lean(),

      UserModel.find({})
        .sort({ created_at: -1 })
        .limit(5)
        .select("name email role is_active avatar_url created_at")
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Admin dashboard fetched successfully",
      data: {
        totalEnquiries,
        totalBlogs,
        totalUsers,
        totalCourses,

        todayEnquiries,
        weeklyUsers,

        publishedBlogs,
        publishedCourses,

        recentEnquiries,
        recentUsers,
      },
    });
  } catch (error: any) {
    console.error("getAdminDashboard error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch admin dashboard",
    });
  }
}