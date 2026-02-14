import express from "express";
import {
  triggerExamGeneration,
  getExams,
  submitExam,
  getExamById,
  toggleExamStatus,
  getExamResult,
} from "../controllers/exam.controller";
import { isAuthenticated, authorizeRoles } from "../middleware/auth";

const examRouter = express.Router();

// so the issue was only from my end. I had to restart the computer, after
examRouter.post(
  "/generate-exam",
  isAuthenticated,
  authorizeRoles(["teacher", "admin"]),
  triggerExamGeneration,
);

examRouter.get(
  "/exams",
  isAuthenticated,
  authorizeRoles(["teacher", "student", "admin"]),
  getExams,
);

// we try on the fronten
// Student Routes
examRouter.post(
  "/submit-exams/:id",
  isAuthenticated,
  authorizeRoles(["student", "admin"]),
  submitExam,
);

// teacher and admin routes
examRouter.patch(
  "/toggle-status/:id",
  isAuthenticated,
  authorizeRoles(["teacher", "admin"]),
  toggleExamStatus,
);

examRouter.get(
  "/result/:id",
  isAuthenticated,
  authorizeRoles(["student", "admin", "teacher"]),
  getExamResult,
);

examRouter.get(
  "/exam/:id",
  isAuthenticated,
  authorizeRoles(["teacher", "student", "admin"]),
  getExamById,
);

export default examRouter;
