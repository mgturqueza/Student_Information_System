import "dotenv/config";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import ClassModel from "../models/Class.js";
import Enrollment from "../models/Enrollment.js";

const CLASS_NAMES = ["11 - Science", "11 - Commerce", "10 - Arts", "9 - ICT", "12 - General"];
const FIRST_NAMES = [
  "John", "Jane", "Michael", "Emily", "David", "Sarah", "Daniel", "Anna", "Chris", "Olivia",
  "James", "Sophia", "Liam", "Mia", "Noah", "Ava", "Lucas", "Ella", "Henry", "Grace"
];
const LAST_NAMES = [
  "Smith", "Johnson", "Brown", "Davis", "Wilson", "Miller", "Taylor", "Moore", "Anderson", "Thomas"
];

function pick(arr, idx) {
  return arr[idx % arr.length];
}

async function seed() {
  await connectDB();

  // Keep superadmin accounts; refresh all generated testing data.
  await Enrollment.deleteMany({});
  await Student.deleteMany({});
  await ClassModel.deleteMany({});
  await User.deleteMany({ role: "admin" });

  const professorsPayload = Array.from({ length: 5 }).map((_, i) => ({
    fullName: `Prof. ${pick(FIRST_NAMES, i)} ${pick(LAST_NAMES, i + 3)}`,
    email: `prof${i + 1}@sis.local`,
    password: "admin123",
    role: "admin"
  }));

  const professors = await User.insertMany(professorsPayload);

  const classPayload = CLASS_NAMES.map((name, i) => ({
    name,
    schedule: i % 2 === 0 ? "Mon, Wed, Fri" : "Tue, Thu",
    room: `Room ${101 + i}`,
    assignedProfessor: professors[i]._id
  }));
  const classes = await ClassModel.insertMany(classPayload);

  await Promise.all(
    professors.map((prof, i) =>
      User.findByIdAndUpdate(prof._id, { $set: { assignedClasses: [classes[i]._id] } })
    )
  );

  const studentsPayload = Array.from({ length: 100 }).map((_, i) => {
    const fullName = `${pick(FIRST_NAMES, i + 2)} ${pick(LAST_NAMES, i + 5)}`;
    return {
      studentId: `STU${String(i + 1).padStart(3, "0")}`,
      fullName,
      gender: i % 3 === 0 ? "Male" : i % 3 === 1 ? "Female" : "Other",
      email: `student${i + 1}@sis.local`,
      phone: `0917${String(100000 + i).slice(-6)}`,
      address: `Block ${i % 20}, Sample City`
    };
  });
  const students = await Student.insertMany(studentsPayload);

  const enrollmentsPayload = students.map((student, i) => ({
    student: student._id,
    classRef: classes[i % classes.length]._id,
    grade: ["A", "B+", "B", "C+"][i % 4],
    attendance: 75 + (i % 26),
    notes: "Seeded sample record"
  }));
  await Enrollment.insertMany(enrollmentsPayload);

  console.log("Sample data created successfully");
  console.log("Professors: 5");
  console.log("Classes: 5");
  console.log("Students: 100");
  console.log("Enrollments: 100");
  console.log("Professor password: admin123");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
