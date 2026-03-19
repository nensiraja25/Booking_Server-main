import express from "express";
import {
  createCategory,
  deleteCategory,
  getReports,
  getStats,
  listCategories,
  listFeedback,
  listRegistrations,
  listRides,
  listUsers,
  updateCategory,
  updateFeedbackStatus,
  updateRegistrationStatus,
} from "../controllers/admin.js";
import authorizeRole from "../middleware/authorizeRole.js";

const router = express.Router();

router.use(authorizeRole("admin"));

router.get("/stats", getStats);
router.get("/users", listUsers);
router.get("/rides", listRides);

// Category management
router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.patch("/categories/:categoryId", updateCategory);
router.delete("/categories/:categoryId", deleteCategory);

// Registration management (responders)
router.get("/registrations", listRegistrations);
router.patch("/registrations/:userId", updateRegistrationStatus);

// Feedback management
router.get("/feedback", listFeedback);
router.patch("/feedback/:feedbackId", updateFeedbackStatus);

// Reports
router.get("/reports", getReports);

export default router;

