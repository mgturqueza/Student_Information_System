import { Router } from "express";
import {
  createAdmin,
  deleteAdmin,
  fireAdmin,
  getAdmins,
  transferProfessor,
  updateAdmin
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/role.js";

const router = Router();
router.use(protect, allowRoles("superadmin"));

router.get("/", getAdmins);
router.post("/", createAdmin);
router.patch("/:id", updateAdmin);
router.delete("/:id", deleteAdmin);
router.post("/:id/fire", fireAdmin);
router.post("/transfer-professor", transferProfessor);

export default router;
