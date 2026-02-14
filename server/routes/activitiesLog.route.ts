import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { getAllActivities } from "../controllers/activityLog.controller";

const logsRouter = express.Router();

logsRouter.get(
  "/activities",
  isAuthenticated,
  authorizeRoles(["admin", "teacher"]),
  getAllActivities,
);

export default logsRouter;
