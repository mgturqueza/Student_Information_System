import Enrollment from "../models/Enrollment.js";
import ClassModel from "../models/Class.js";

export async function getEnrollments(req, res) {
  const query = {};
  if (req.query.classId) query.classRef = req.query.classId;

  if (req.user.role === "admin") {
    const classes = await ClassModel.find({ assignedProfessor: req.user._id }).select("_id");
    query.classRef = { $in: classes.map((item) => item._id) };
  }

  const enrollments = await Enrollment.find(query)
    .populate("student", "studentId fullName email")
    .populate("classRef", "name schedule room");
  return res.json(enrollments);
}

export async function createEnrollment(req, res) {
  const enrollment = await Enrollment.create(req.body);
  return res.status(201).json(enrollment);
}

export async function updateEnrollment(req, res) {
  const enrollment = await Enrollment.findById(req.params.id).populate("classRef", "assignedProfessor");
  if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

  if (req.user.role === "admin" && enrollment.classRef.assignedProfessor?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "You can only update your class enrollments" });
  }

  Object.assign(enrollment, req.body);
  await enrollment.save();
  return res.json(enrollment);
}

export async function deleteEnrollment(req, res) {
  const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
  if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
  return res.json({ message: "Enrollment deleted" });
}
