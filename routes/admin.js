import express from "express";
import { getStats, listRides, listUsers } from "../controllers/admin.js";
import authorizeRole from "../middleware/authorizeRole.js";

const router = express.Router();

router.use(authorizeRole("admin"));

router.get("/stats", getStats);
router.get("/users", listUsers);
router.get("/rides", listRides);

export default router;

