import { Router } from "express";
import { createClass, deleteClass, getClasses, updateClass } from "../controllers/classController.js";
import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/role.js";

const router = Router();
router.use(protect);

router.get("/", allowRoles("superadmin", "admin"), getClasses);
router.post("/", allowRoles("superadmin"), createClass);
router.patch("/:id", allowRoles("superadmin"), updateClass);
router.delete("/:id", allowRoles("superadmin"), deleteClass);

export default router;
