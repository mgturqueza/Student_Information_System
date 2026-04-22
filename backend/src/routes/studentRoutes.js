import { Router } from "express";
import {
  createStudent,
  deleteStudent,
  expelStudent,
  getStudents,
  transferStudent,
  updateStudent
} from "../controllers/studentController.js";
import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/role.js";

const router = Router();
router.use(protect);

router.get("/", allowRoles("superadmin", "admin"), getStudents);
router.post("/", allowRoles("superadmin"), createStudent);
router.patch("/:id", allowRoles("superadmin", "admin"), updateStudent);
router.delete("/:id", allowRoles("superadmin"), deleteStudent);
router.post("/:id/expel", allowRoles("superadmin"), expelStudent);
router.post("/:id/transfer", allowRoles("superadmin"), transferStudent);

export default router;
