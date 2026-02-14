import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";
import User from "../models/User";
import { logActivity } from "../utils/activitiesLog";

// @desc    Get user info (via cookie)
// @route   GET /api/me
// @access  Private
export const getUserProfile = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user?._id);
    if (!user) {
      return next(new ErrorHandler("User doesn't exists", 400));
    }

    res.status(200).json({
      success: true,
      user,
    });
  },
);

// update user password
interface IUpdatePassword {
  oldPassword?: string;
  newPassword?: string;
}

// @desc    Update user password
// @route   GET /api/update-password
// @access  Private

export const updatePassword = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword } = req.body as IUpdatePassword;

    if (!oldPassword || !newPassword) {
      return next(new ErrorHandler("Please enter old and new password", 400));
    }

    const user = await User.findById(req.user?._id).select("+password");

    if (user?.password === undefined) {
      return next(new ErrorHandler("Invalid user", 400));
    }

    // Verify the old password is correct
    const isOldPasswordValid = await user.comparePassword(oldPassword);
    if (!isOldPasswordValid) {
      return next(new ErrorHandler("Old password is incorrect", 400));
    }

    // Check if new password is different from current password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return next(
        new ErrorHandler(
          "New password must be different from the previous one!",
          400,
        ),
      );
    }

    if (newPassword.trim().length < 6 || newPassword.trim().length > 20) {
      return next(
        new ErrorHandler(
          "Password must be at least 6 characters and no more than 20 characters!",
          400,
        ),
      );
    }

    user.password = newPassword.trim();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully!",
    });
  },
);

// @desc    Update user (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      user.isActive =
        req.body.isActive !== undefined ? req.body.isActive : user.isActive;
      user.studentClass = req.body.studentClass || user.studentClass;
      user.teacherSubject = req.body.teacherSubject || user.teacherSubject;
      if (req.body.password) {
        user.password = req.body.password;
      }
      const updatedUser = await user.save();

      if (req.user?._id) {
        await logActivity({
          userId: req.user._id.toString(),
          action: "Updated User",
          details: `Updated user with email: ${updatedUser.email}`,
        });
      }

      res.status(200).json({
        success: true,
        updatedUser,
        message: "User updated successfully",
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  },
);

// @desc    Get all users (With Pagination & Filtering)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Parse Query Params safely
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;
    const search = req.query.search as string; // Optional: Add search later

    const skip = (page - 1) * limit;

    // 2. Build Filter Object
    const filter: any = {};

    if (role && role !== "all" && role !== "") {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    // 3. Fetch Users with Pagination & Filtering
    const [total, users] = await Promise.all([
      User.countDocuments(filter), // Get total count for pagination logic
      User.find(filter)
        .select("-password")
        // .populate("studentClass", "_id name section") // Added section for context
        // .populate("teacherSubjects", "_id name code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    // 4. Send Response
    res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  },
);

// next
// @desc    Delete user (Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      if (req.user?._id) {
        await logActivity({
          userId: req.user._id.toString(),
          action: "Deleted User",
          details: `Deleted user with email: ${user.email}`,
        });
      }
      res.json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  },
);

// update user password (for authenticated user)
export const updateUserPassword = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return next(
          new ErrorHandler("Please provide current and new password", 400),
        );
      }

      if (newPassword.trim().length < 6 || newPassword.trim().length > 20) {
        return next(
          new ErrorHandler("Password must be between 6 and 20 characters", 400),
        );
      }

      const user = await User.findById(req.user?._id).select("+password");

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      const isPasswordMatch = await user.comparePassword(currentPassword);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Current password is incorrect", 400));
      }

      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        return next(
          new ErrorHandler(
            "New password must be different from current password",
            400,
          ),
        );
      }

      user.password = newPassword.trim();
      await user.save();

      res.status(200).json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// find user information by Id
export const getUserById = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// update user role --- only for admin
export const updateUserStatus = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, role, isActive } = req.body;

      if (!id) {
        return next(new ErrorHandler("User ID is required", 400));
      }

      const user = await User.findById(id);

      if (!user) {
        return next(new ErrorHandler(`User not found: ${id}`, 404));
      }

      // Prevent admin from deactivating themselves
      if (
        req.user?._id.toString() === id &&
        isActive === false
      ) {
        return next(
          new ErrorHandler("You cannot deactivate your own account", 400),
        );
      }

      // Prevent changing own role
      if (
        req.user?._id.toString() === id &&
        role &&
        role !== user.role
      ) {
        return next(new ErrorHandler("You cannot change your own role", 400));
      }

      const updateData: any = {};
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedUser = await User.findByIdAndUpdate(id, updateData, {
        new: true,
      }).select("-password");

      res.status(200).json({
        success: true,
        message: "User status updated successfully",
        user: updatedUser,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);