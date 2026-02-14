import express from "express";
import { isAuthenticated } from "../middleware/auth";
import {
  forgotPassword,
  login,
  logout,
  refreshAccessToken,
  Register,
  resetPassword,
} from "../controllers/auth.controller";

const authRouter = express.Router();

// make sure to protect to get access to the user token
// authRouter.post(
//   "/register",
//   isAuthenticated,
//   authorizeRoles(["admin", "teacher"]),
//   register,
// );
authRouter.post("/register", Register);
authRouter.post("/login", login);
authRouter.get("/logout", isAuthenticated, logout);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.post("/refresh-token", refreshAccessToken);

export default authRouter;
