import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    schedule: { type: String, trim: true },
    room: { type: String, trim: true },
    assignedProfessor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default mongoose.model("Class", classSchema);
