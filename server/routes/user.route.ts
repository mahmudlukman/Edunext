import express from "express";
import {
  updateUser,
  deleteUser,
  getUserProfile,
  getUsers,
} from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const userRouter = express.Router();

userRouter.get("/me", isAuthenticated, getUserProfile);
userRouter.get(
  "/users",
  isAuthenticated,
  authorizeRoles(["admin", "teacher"]),
  getUsers,
);
userRouter.put(
  "/update-user/:id",
  isAuthenticated,
  authorizeRoles(["admin", "teacher"]),
  updateUser,
);
userRouter.delete(
  "/delete/:id",
  isAuthenticated,
  authorizeRoles(["admin", "teacher"]),
  deleteUser,
);

export default userRouter;
