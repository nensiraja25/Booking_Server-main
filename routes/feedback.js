import express from "express";
import { createFeedback, myFeedback } from "../controllers/feedback.js";

const router = express.Router();

router.post("/", createFeedback);
router.get("/me", myFeedback);

export default router;

