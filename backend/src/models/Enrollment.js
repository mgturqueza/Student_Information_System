import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    classRef: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    grade: { type: String, trim: true },
    attendance: { type: Number, min: 0, max: 100, default: 0 },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, classRef: 1 }, { unique: true });

export default mongoose.model("Enrollment", enrollmentSchema);
