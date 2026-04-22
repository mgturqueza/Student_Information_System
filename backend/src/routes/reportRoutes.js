import { Router } from "express";
import { getSystemReport } from "../controllers/reportController.js";
import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/role.js";

const router = Router();
router.use(protect, allowRoles("superadmin"));
router.get("/system", getSystemReport);

export default router;
