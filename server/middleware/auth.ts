import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "./catchAsyncErrors";
import jwt, { JwtPayload } from "jsonwebtoken";
import ErrorHandler from "../utils/errorHandler";
import User, { userRoles } from "../models/User";
import config from "../config";

// authenticated user
export const isAuthenticated = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token as string;

    if (!access_token) {
      return next(
        new ErrorHandler("Please login to access this resource", 401)
      );
    }

    try {
      // Verify access token
      const decoded = jwt.verify(
        access_token,
        config.JWT_SECRET_KEY as string
      ) as JwtPayload;

      if (!decoded || !decoded.id) {
        return next(new ErrorHandler("Access token is not valid", 401));
      }

      // Get user from database
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      // Check if user account is active
      if (!user.isActive) {
        return next(
          new ErrorHandler(
            "This account has been suspended! Try to contact the admin",
            403
          )
        );
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error: any) {
      // Handle different JWT errors
      if (error.name === "TokenExpiredError") {
        return next(
          new ErrorHandler(
            "Access token expired. Please refresh your token",
            401
          )
        );
      }

      if (error.name === "JsonWebTokenError") {
        return next(new ErrorHandler("Invalid access token", 401));
      }

      if (error.name === "NotBeforeError") {
        return next(new ErrorHandler("Access token not active yet", 401));
      }

      // Generic error
      return next(new ErrorHandler("Authentication failed", 401));
    }
  }
);

// validate user role
export const authorizeRoles = (roles: userRoles[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `User role (${req.user?.role}) is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
