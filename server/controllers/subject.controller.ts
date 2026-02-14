import { NextFunction, type Request, type Response } from "express";
import { logActivity } from "../utils/activitiesLog";
import Subject from "../models/Subject";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";

// @desc    Create a new Subject
// @route   POST /api/subjects
// @access  Private/Admin
export const createSubject = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, code, teacher } = req.body; // Expecting teacher to be ["ID1", "ID2"]
    const subjectExists = await Subject.findOne({ code });
    if (subjectExists) {
      return next(new ErrorHandler("Subject code already exists", 400));
    }
    const newSubject = await Subject.create({
      name,
      code,
      teacher: Array.isArray(teacher) ? teacher : [],
    });
    if (newSubject && req.user?._id) {
      await logActivity({
        userId: req.user._id.toString(),
        action: `Created subject: ${newSubject.name}`,
      });
      res.status(201).json({
        success: true,
        message: "Subject Created Successfully",
        newSubject,
      });
    }
  },
);

// @desc    Get all Subjects
// @route   GET /api/subjects
// @access  Private
export const getAllSubjects = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Parse Query Parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    // 2. Build Search Query (Search by Name OR Code)
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }
    // 3. Execute Query (Count & Find)
    const [total, subjects] = await Promise.all([
      Subject.countDocuments(query),
      Subject.find(query)
        .populate("teacher", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);
    // 4. Return Data + Pagination Meta
    res.status(200).json({
      success: true,
      subjects,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  },
);

// @desc    Update Subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
export const updateSubject = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, code, teacher } = req.body;

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      {
        name,
        code,
        teacher: Array.isArray(teacher) ? teacher : [],
      },
      { new: true, runValidators: true },
    );
    if (req.user?._id) {
      await logActivity({
        userId: req.user._id.toString(),
        action: `Updated subject: ${updatedSubject?.name}`,
      });
    }
    if (!updatedSubject) {
      return next(new ErrorHandler("Subject not found", 400));
    }

    res.status(200).json({
      success: true,
      message: "Subject Updated Successfully",
      updatedSubject,
    });
  },
);

// @desc    Delete Subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
export const deleteSubject = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const deletedSubject = await Subject.findByIdAndDelete(req.params.id);
    if (!deletedSubject) {
      return next(new ErrorHandler("Subject not found", 400));
    }

    if (req.user?._id) {
      await logActivity({
        userId: req.user._id.toString(),
        action: `Updated subject: ${deletedSubject?.name}`,
      });
    }
    res
      .status(200)
      .json({ success: true, message: "Subject deleted successfully" });
  },
);
