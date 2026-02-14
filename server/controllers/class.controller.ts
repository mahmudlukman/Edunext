import { NextFunction, type Request, type Response } from "express";
import Class from "../models/Class";
import { logActivity } from "../utils/activitiesLog";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";
import { Types } from "mongoose";

// @desc    Create a new Class
// @route   POST /api/classes
// @access  Private/Admin
export const createClass = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, academicYear, classTeacher, capacity } = req.body;

    const existingClass = await Class.findOne({ name, academicYear });
    if (existingClass) {
      return next(
        new ErrorHandler(
          "Class with this name already exists for the specified academic year.",
          400,
        ),
      );
    }

    const newClass = await Class.create({
      name,
      academicYear,
      classTeacher,
      capacity,
    });
    if (req.user?._id) {
      await logActivity({
        userId: req.user._id.toString(),
        action: `Created new class: ${newClass.name}`,
      });
    }
    res
      .status(201)
      .json({ success: true, message: "Class Created Successfully", newClass });
  },
);

// @desc    Get All Classes
// @route   GET /api/classes
// @access  Private
export const getAllClasses = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Parse Query Parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    // 2. Build Search Query (Case-insensitive regex on Name)
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // 3. Execute Query (Count & Find)
    const [total, classes] = await Promise.all([
      Class.countDocuments(query),
      Class.find(query)
        .populate("academicYear", "name")
        .populate("classTeacher", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    // 4. Return Data + Pagination Meta
    res.status(200).json({
      success: true,
      classes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  },
);

// @desc    Update Class
// @route   PUT /api/classes/:id
// @access  Private/Admin
export const updateClass = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const classId = req.params.id as string;

    // Validate classId is a valid ObjectId
    if (!Types.ObjectId.isValid(classId)) {
      return next(new ErrorHandler("Invalid class ID", 400));
    }

    try {
      // Update the class - let MongoDB handle duplicate detection via unique index
      const updatedClass = await Class.findByIdAndUpdate(classId, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updatedClass) {
        return next(new ErrorHandler("Class not found", 404));
      }

      // Log activity
      if (req.user?._id) {
        await logActivity({
          userId: req.user._id.toString(),
          action: `Updated class: ${updatedClass.name}`,
        });
      }

      res.status(200).json({
        success: true,
        message: "Class Updated Successfully",
        updatedClass,
      });
    } catch (error: any) {
      // Handle duplicate key error from MongoDB unique index
      if (error.code === 11000) {
        return next(
          new ErrorHandler(
            "A class with this name already exists in the selected academic year",
            400,
          ),
        );
      }
      throw error; // Re-throw other errors
    }
  },
);

// @desc    Delete Class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
export const deleteClass = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    const userId = req.user?._id;
    if (userId) {
      await logActivity({
        userId: userId.toString(),
        action: `Deleted class: ${deletedClass?.name}`,
      });
    }

    if (!deletedClass) {
      return next(new ErrorHandler("Class not found", 404));
    }
    res.json({ success: true, message: "Class Removed Successfully!" });
  },
);
