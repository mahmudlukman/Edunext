import dotenv from "dotenv";
import User, { IUser } from "../models/User";
import ErrorHandler from "../utils/errorHandler";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import { NextFunction, Request, Response } from "express";
import jwt, { Secret } from "jsonwebtoken";
import sendMail from "../utils/sendMail";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwtToken";
import config from "../config";
import { logActivity } from "../utils/activitiesLog";

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Private (Admin & Teacher only)
export const Register = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      name,
      email,
      password,
      role,
      studentClass,
      teacherSubject,
      isActive,
    } = req.body;

    // Normalize email to lowercase
    const emailLowerCase = email.toLowerCase().trim();

    const isEmailExist = await User.findOne({ email: emailLowerCase });
    if (isEmailExist) {
      return next(new ErrorHandler("Email already exist", 400));
    }

    // create user
    const newUser = await User.create({
      name,
      email,
      password,
      role,
      studentClass,
      teacherSubject,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      newUser,
    });
  },
);

// Login user
interface ILoginRequest {
  email: string;
  password: string;
}

export const login = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
      }
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("Invalid credentials", 400));
      }

      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid credentials", 400));
      }

      const { isActive } = user;
      if (!isActive) {
        return next(
          new ErrorHandler(
            "This account has been suspended! Try to contact the admin",
            403,
          ),
        );
      }
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const logout = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Clear both tokens
      res.cookie("access_token", "", {
        maxAge: 1,
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      res.cookie("refresh_token", "", {
        maxAge: 1,
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// ============================================
// REFRESH ACCESS TOKEN
// ============================================
export const refreshAccessToken = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;

      if (!refresh_token) {
        return next(
          new ErrorHandler("Please login to access this resource", 401),
        );
      }

      // Verify refresh token
      const decoded = jwt.verify(
        refresh_token,
        config.REFRESH_TOKEN_SECRET as Secret,
      ) as { id: string };

      if (!decoded) {
        return next(new ErrorHandler("Invalid refresh token", 401));
      }

      // Get user from database
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Check if account is active
      if (!user.isActive) {
        return next(
          new ErrorHandler(
            "This account has been suspended! Try to contact the admin",
            403,
          ),
        );
      }

      // Generate new access token
      const newAccessToken = user.getJwtToken();

      // Generate new refresh token (token rotation for security)
      const newRefreshToken = user.getRefreshToken();

      // Set new cookies
      res.cookie("access_token", newAccessToken, accessTokenOptions);
      res.cookie("refresh_token", newRefreshToken, refreshTokenOptions);

      // Also send in response for frontend state management
      res.status(200).json({
        success: true,
        accessToken: newAccessToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      });
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return next(
          new ErrorHandler("Refresh token expired. Please login again", 401),
        );
      }
      if (error.name === "JsonWebTokenError") {
        return next(new ErrorHandler("Invalid refresh token", 401));
      }
      return next(new ErrorHandler("Could not refresh token", 401));
    }
  },
);

// Function to create an activation token
export const createActivationToken = (user: any): string => {
  const token = jwt.sign({ user }, config.ACTIVATION_SECRET as Secret, {
    expiresIn: "5m",
  });
  return token;
};


export const forgotPassword = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      if (!email) {
        return next(new ErrorHandler("Please provide a valid email!", 400));
      }

      const emailLowerCase = email.toLowerCase();
      const user = await User.findOne({ email: emailLowerCase });
      if (!user) {
        return next(new ErrorHandler("User not found, invalid request!", 400));
      }

      const { isActive } = user;
      if (!isActive) {
        return next(
          new ErrorHandler(
            "This account has been suspended! Try to contact the admin",
            403,
          ),
        );
      }

      const resetToken = createActivationToken(user);

      const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}&id=${user._id}`;

      const data = { user: { name: user.name }, resetUrl };

      try {
        await sendMail({
          email: user.email,
          subject: "Reset your password",
          template: "forgot-password-mail.ejs",
          data,
        });

        res.status(201).json({
          success: true,
          message: `Please check your email: ${user.email} to reset your password!`,
          resetToken: resetToken,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// update user password
interface IResetPassword {
  newPassword: string;
}

// reset password
export const resetPassword = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { newPassword } = req.body as IResetPassword;
      const { id } = req.query;

      if (!id) {
        return next(new ErrorHandler("No user ID provided!", 400));
      }

      const user = await User.findById(id).select("+password");

      if (!user) {
        return next(new ErrorHandler("user not found!", 400));
      }

      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword)
        return next(
          new ErrorHandler(
            "New password must be different from the previous one!",
            400,
          ),
        );

      if (newPassword.trim().length < 6 || newPassword.trim().length > 20) {
        return next(
          new ErrorHandler(
            "Password must be between at least 6 characters!",
            400,
          ),
        );
      }

      user.password = newPassword.trim();
      await user.save();

      res.status(201).json({
        success: true,
        message: `Password Reset Successfully', 'Now you can login with new password!`,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);
