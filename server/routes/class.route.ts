import express from "express";
import {
  createClass,
  updateClass,
  deleteClass,
  getAllClasses,
} from "../controllers/class.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";

const classRouter = express.Router();

classRouter.post(
  "/create-class",
  isAuthenticated,
  authorizeRoles(["admin"]),
  createClass,
);
classRouter.get(
  "/classes",
  isAuthenticated,
  authorizeRoles(["admin"]),
  getAllClasses,
);
classRouter.patch(
  "/update-class/:id",
  isAuthenticated,
  authorizeRoles(["admin"]),
  updateClass,
);
classRouter.delete(
  "/delete-class/:id",
  isAuthenticated,
  authorizeRoles(["admin"]),
  deleteClass,
);

export default classRouter;
