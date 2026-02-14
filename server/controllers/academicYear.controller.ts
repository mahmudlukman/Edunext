import { NextFunction, type Request, type Response } from "express";
import AcademicYear from "../models/AcademicYear";
import { logActivity } from "../utils/activitiesLog";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";
import { Types } from "mongoose";

// @desc    Create a new Academic Year
// @route   POST /api/academic-years
// @access  Private/Admin
export const createAcademicYear = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, fromYear, toYear, isCurrent } = req.body;

    const existingYear = await AcademicYear.findOne({ fromYear, toYear });
    if (existingYear) {
      return next(new ErrorHandler("Academic Year already exists", 400));
    }
    // If isCurrent is true, set all other academic years to false
    if (isCurrent) {
      // the issue is here
      await AcademicYear.updateMany(
        { _id: { $ne: null } },
        { isCurrent: false },
      );
      // we should no use return since we want the function to continue
    }
    const academicYear = await AcademicYear.create({
      name,
      fromYear,
      toYear,
      isCurrent: isCurrent || false,
    });
    // Log activity
    if (req.user?._id) {
      await logActivity({
        userId: req.user._id.toString(),
        action: `Created academic year ${name}`,
      });
    }
    res.status(201).json({
      success: true,
      message: "Academic Year Created Successfully",
      academicYear,
    });
  },
);

// @desc    Get all Academic Years (Paginated & Searchable)
// @route   GET /api/academic-years
// @access  Private/Admin
export const getAllAcademicYears = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    // Build Search Query (Search by Name)
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    const [total, years] = await Promise.all([
      AcademicYear.countDocuments(query),
      AcademicYear.find(query)
        .sort({ createdAt: -1 }) // Newest first
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      years,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  },
);

// @desc    Get the current active Academic Year
// @route   GET /api/academic-years/current
// @access  Public or Protected
export const getCurrentAcademicYear = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const currentYear = await AcademicYear.findOne({ isCurrent: true });
    if (!currentYear) {
      return next(new ErrorHandler("No current academic year found", 404));
    } else {
      res.status(200).json({ success: true, currentYear });
    }
  },
);

// @desc    Update Academic Year
// @route   PUT /api/academic-years/:id
// @access  Private/Admin
export const updateAcademicYear = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { isCurrent } = req.body;
    const academicYearId = req.params.id as string;

    // Validate academicYearId is a valid ObjectId
    if (!Types.ObjectId.isValid(academicYearId)) {
      return next(new ErrorHandler("Invalid academic year ID", 400));
    }

    // If setting this as current, unset all others
    if (isCurrent) {
      await AcademicYear.updateMany(
        { _id: { $ne: new Types.ObjectId(academicYearId) } }, // Convert to ObjectId
        { isCurrent: false },
      );
    }

    // Update the academic year
    const updatedYear = await AcademicYear.findByIdAndUpdate(
      academicYearId,
      req.body,
      { new: true, runValidators: true },
    );

    if (!updatedYear) {
      return next(new ErrorHandler("Academic Year not found", 404));
    }

    // Log activity
    if (req.user?._id) {
      await logActivity({
        userId: req.user._id.toString(),
        action: `Updated academic year: ${updatedYear.name}`,
      });
    }

    res.status(200).json({
      success: true,
      updatedYear,
    });
  },
);

// @desc    Delete Academic Year
// @route   DELETE /api/academic-years/:id
// @access  Private/Admin
export const deleteAcademicYear = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const year = await AcademicYear.findById(req.params.id);
    if (!year) {
      res.status(404).json({ message: "Academic Year not found" });
      return;
    }
    if (year) {
      // Prevent deletion if it's the current academic year to avoid system breakage
      if (year.isCurrent) {
        res
          .status(400)
          .json({ message: "Cannot delete the current academic year" });
        return;
      }
    }
    await year.deleteOne();

    // Log activity
    if (req.user?._id) {
      await logActivity({
        userId: req.user._id.toString(),
        action: `Deleted academic year ${year.name}`,
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Academic Year deleted successfully!" });
  },
);
