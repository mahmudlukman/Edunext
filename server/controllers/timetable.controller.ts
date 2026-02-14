import { NextFunction, type Request, type Response } from "express";
import { logActivity } from "../utils/activitiesLog";
import { inngest } from "../inngest";
import Timetable from "../models/Timatable";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";

// @desc    Generate a Timetable using AI
// @route   POST /api/timetables/generate
// @access  Private/Admin
export const generateTimetable = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { classId, academicYearId, settings } = req.body;

    await inngest.send({
      name: "generate/timetable",
      data: {
        classId,
        academicYearId,
        settings,
      },
    });

    if (req.user?._id) {
      await logActivity({
        userId: req.user._id.toString(),
        action: `Requested timetable generation for class ID: ${classId}`,
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Timetable generation initiated" });
  },
);

// @desc    Get Timetable by Class
// @route   GET /api/timetables/:classId
export const getTimetable = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const timetable = await Timetable.findOne({ class: req.params.classId })
      .populate("schedule.periods.subject", "name code")
      .populate("schedule.periods.teacher", "name email");

    if (!timetable) return next(new ErrorHandler("Timetable not found", 400));

    res.status(200).json({ success: true, timetable });
  },
);
