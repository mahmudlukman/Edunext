import express from "express";
import {
  createAcademicYear,
  getCurrentAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  getAllAcademicYears,
} from "../controllers/academicYear.controller";

import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const academicYearRouter = express.Router();

academicYearRouter
  .route("/academic-years")
  .get(isAuthenticated, authorizeRoles(["admin"]), getAllAcademicYears);

academicYearRouter
  .route("/create-academic-year")
  .post(isAuthenticated, authorizeRoles(["admin"]), createAcademicYear);

academicYearRouter
  .route("/current-academic-year")
  .get(isAuthenticated, getCurrentAcademicYear);

academicYearRouter
  .route("/update-academic-year/:id")
  .patch(isAuthenticated, authorizeRoles(["admin"]), updateAcademicYear);

academicYearRouter
  .route("/delete-academic-year/:id")
  .delete(isAuthenticated, authorizeRoles(["admin"]), deleteAcademicYear);

export default academicYearRouter;
