import express from "express";
import { getDashboardStats } from "../controllers//dashboard.controller";
// import { generateDashboardInsight } from "../controllers/aiController";
import { isAuthenticated } from "../middleware/auth";

const dashboardRouter = express.Router();

dashboardRouter.get("/stats", isAuthenticated, getDashboardStats);

// Get AI Insight
// router.post("/insight", protect, generateDashboardInsight);

export default dashboardRouter;
