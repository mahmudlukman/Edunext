import { NextFunction, type Request, type Response } from "express";
import ActivityLog from "../models/ActivityLog";
import { catchAsyncError } from "../middleware/catchAsyncErrors";

// @desc    Get System Activity Logs(including pagination)
// @route   GET /api/activity
// @access  Private/Admin
export const getAllActivities = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const count = await ActivityLog.countDocuments();

    const logs = await ActivityLog.find()
      .populate("user", "name email role") // populate user details
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      logs,
      page,
      pages: Math.ceil(count / limit),
      total: count,
    });
  },
);
