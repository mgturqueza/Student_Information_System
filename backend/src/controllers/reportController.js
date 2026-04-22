import User from "../models/User.js";
import Student from "../models/Student.js";
import ClassModel from "../models/Class.js";
import Enrollment from "../models/Enrollment.js";

export async function getSystemReport(req, res) {
  const [totalAdmins, totalStudents, totalClasses, totalEnrollments] = await Promise.all([
    User.countDocuments({ role: "admin" }),
    Student.countDocuments(),
    ClassModel.countDocuments(),
    Enrollment.countDocuments()
  ]);

  return res.json({
    totalAdmins,
    totalStudents,
    totalClasses,
    totalEnrollments
  });
}
