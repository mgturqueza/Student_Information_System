import { Router } from "express";
import { bootstrapSuperAdmin, login, me } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.post("/bootstrap-superadmin", bootstrapSuperAdmin);
router.post("/login", login);
router.get("/me", protect, me);

export default router;
