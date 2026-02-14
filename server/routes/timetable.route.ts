import express from "express";
import {
  generateTimetable,
  getTimetable,
} from "../controllers/timetable.controller";
import { isAuthenticated, authorizeRoles } from "../middleware/auth";

const timeRouter = express.Router();

timeRouter.post(
  "/generate-timetable",
  isAuthenticated,
  authorizeRoles(["admin"]),
  generateTimetable,
);

timeRouter.get("/timetable/:classId", isAuthenticated, getTimetable);

export default timeRouter;
