import Student from "../models/Student.js";
import ClassModel from "../models/Class.js";
import Enrollment from "../models/Enrollment.js";

export async function getStudents(req, res) {
  const search = req.query.search?.trim();
  const query = {};
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { studentId: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  if (req.user.role === "admin") {
    const classes = await ClassModel.find({ assignedProfessor: req.user._id }).select("_id");
    const classIds = classes.map((item) => item._id);
    const enrollments = await Enrollment.find({ classRef: { $in: classIds } }).select("student");
    query._id = { $in: enrollments.map((e) => e.student) };
  }

  const students = await Student.find(query).sort({ createdAt: -1 });
  return res.json(students);
}

export async function createStudent(req, res) {
  const { studentId, fullName } = req.body;
  if (!studentId || !fullName) return res.status(400).json({ message: "studentId and fullName are required" });
  const exists = await Student.findOne({ studentId });
  if (exists) return res.status(409).json({ message: "Student ID already exists" });
  const created = await Student.create(req.body);
  return res.status(201).json(created);
}

export async function updateStudent(req, res) {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });

  if (req.user.role === "admin") {
    const classes = await ClassModel.find({ assignedProfessor: req.user._id }).select("_id");
    const classIds = classes.map((item) => item._id);
    const allowed = await Enrollment.exists({ classRef: { $in: classIds }, student: student._id });
    if (!allowed) return res.status(403).json({ message: "You can only edit students in your classes" });
  }

  Object.assign(student, req.body);
  await student.save();
  return res.json(student);
}

export async function deleteStudent(req, res) {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  await Enrollment.deleteMany({ student: req.params.id });
  return res.json({ message: "Student deleted" });
}

export async function expelStudent(req, res) {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  await Enrollment.deleteMany({ student: req.params.id });
  return res.json({ message: "Student expelled from the system" });
}

export async function transferStudent(req, res) {
  const { fromClassId, toClassId } = req.body;
  if (!fromClassId || !toClassId) {
    return res.status(400).json({ message: "fromClassId and toClassId are required" });
  }
  if (fromClassId === toClassId) {
    return res.status(400).json({ message: "Source and destination class cannot be the same" });
  }

  const [student, fromClass, toClass] = await Promise.all([
    Student.findById(req.params.id),
    ClassModel.findById(fromClassId),
    ClassModel.findById(toClassId)
  ]);
  if (!student) return res.status(404).json({ message: "Student not found" });
  if (!fromClass || !toClass) return res.status(404).json({ message: "Class not found" });

  const existingTarget = await Enrollment.exists({ student: student._id, classRef: toClassId });
  if (existingTarget) {
    return res.status(409).json({ message: "Student is already enrolled in the target class" });
  }

  const sourceEnrollment = await Enrollment.findOne({ student: student._id, classRef: fromClassId });
  if (!sourceEnrollment) {
    return res.status(404).json({ message: "Student is not enrolled in the source class" });
  }

  sourceEnrollment.classRef = toClassId;
  await sourceEnrollment.save();

  return res.json({ message: "Student transferred successfully" });
}
