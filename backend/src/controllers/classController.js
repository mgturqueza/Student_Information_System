import ClassModel from "../models/Class.js";
import User from "../models/User.js";

export async function getClasses(req, res) {
  const search = req.query.search?.trim();
  const query = {};
  if (search) query.name = { $regex: search, $options: "i" };
  if (req.user.role === "admin") query.assignedProfessor = req.user._id;

  const classes = await ClassModel.find(query).populate("assignedProfessor", "fullName email");
  return res.json(classes);
}

export async function createClass(req, res) {
  const { name, assignedProfessor } = req.body;
  if (!name) return res.status(400).json({ message: "Class name is required" });

  const classDoc = await ClassModel.create(req.body);

  if (assignedProfessor) {
    await User.findByIdAndUpdate(assignedProfessor, { $addToSet: { assignedClasses: classDoc._id } });
  }
  return res.status(201).json(classDoc);
}

export async function updateClass(req, res) {
  const current = await ClassModel.findById(req.params.id);
  if (!current) return res.status(404).json({ message: "Class not found" });

  const prevProfessor = current.assignedProfessor?.toString();
  Object.assign(current, req.body);
  await current.save();

  if (prevProfessor && prevProfessor !== current.assignedProfessor?.toString()) {
    await User.findByIdAndUpdate(prevProfessor, { $pull: { assignedClasses: current._id } });
  }
  if (current.assignedProfessor) {
    await User.findByIdAndUpdate(current.assignedProfessor, { $addToSet: { assignedClasses: current._id } });
  }
  return res.json(current);
}

export async function deleteClass(req, res) {
  const classDoc = await ClassModel.findByIdAndDelete(req.params.id);
  if (!classDoc) return res.status(404).json({ message: "Class not found" });
  await User.updateMany({}, { $pull: { assignedClasses: classDoc._id } });
  return res.json({ message: "Class deleted" });
}
