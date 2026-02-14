import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  createSubject,
  getAllSubjects,
  updateSubject,
  deleteSubject,
} from "../controllers/subject.controller";

const subjectRouter = express.Router();

subjectRouter
  .route("/create-subject")
  .post(isAuthenticated, authorizeRoles(["admin"]), createSubject);

subjectRouter
  .route("/subjects")
  .get(isAuthenticated, authorizeRoles(["admin", "teacher"]), getAllSubjects);

subjectRouter
  .route("/delete-subject/:id")
  .delete(isAuthenticated, authorizeRoles(["admin"]), deleteSubject);

subjectRouter
  .route("/update-subject/:id")
  .patch(isAuthenticated, authorizeRoles(["admin"]), updateSubject);

export default subjectRouter;
