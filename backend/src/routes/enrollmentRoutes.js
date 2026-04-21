import { Router } from "express";
import { createEnrollment, deleteEnrollment, getEnrollments, updateEnrollment } from "../controllers/enrollmentController.js";
import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/role.js";

const router = Router();
router.use(protect);

router.get("/", allowRoles("superadmin", "admin"), getEnrollments);
router.post("/", allowRoles("superadmin"), createEnrollment);
router.patch("/:id", allowRoles("superadmin", "admin"), updateEnrollment);
router.delete("/:id", allowRoles("superadmin"), deleteEnrollment);

export default router;
