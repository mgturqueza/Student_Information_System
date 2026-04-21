import User from "../models/User.js";
import ClassModel from "../models/Class.js";

export async function getAdmins(req, res) {
  const search = req.query.search?.trim();
  const query = { role: "admin" };
  if (search) {
    query.$or = [{ fullName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
  }
  const admins = await User.find(query).select("-password").populate("assignedClasses", "name");
  return res.json(admins);
}

export async function createAdmin(req, res) {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "fullName, email, password are required" });
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: "Email already exists" });
  const admin = await User.create({ fullName, email, password, role: "admin" });
  return res.status(201).json({ id: admin._id, fullName: admin.fullName, email: admin.email, role: admin.role });
}

export async function updateAdmin(req, res) {
  const updates = { ...req.body };
  delete updates.role;
  delete updates.password;
  const admin = await User.findOneAndUpdate({ _id: req.params.id, role: "admin" }, updates, { new: true }).select("-password");
  if (!admin) return res.status(404).json({ message: "Admin not found" });
  return res.json(admin);
}

export async function deleteAdmin(req, res) {
  const admin = await User.findOneAndDelete({ _id: req.params.id, role: "admin" });
  if (!admin) return res.status(404).json({ message: "Admin not found" });
  return res.json({ message: "Admin deleted" });
}

export async function fireAdmin(req, res) {
  const { replacementProfessorId } = req.body;
  const admin = await User.findOne({ _id: req.params.id, role: "admin" });
  if (!admin) return res.status(404).json({ message: "Admin not found" });

  if (replacementProfessorId) {
    const replacement = await User.findOne({ _id: replacementProfessorId, role: "admin" });
    if (!replacement) return res.status(404).json({ message: "Replacement professor not found" });
    if (replacement._id.toString() === admin._id.toString()) {
      return res.status(400).json({ message: "Replacement professor must be different" });
    }

    await ClassModel.updateMany(
      { assignedProfessor: admin._id },
      { $set: { assignedProfessor: replacement._id } }
    );
    await User.findByIdAndUpdate(replacement._id, { $addToSet: { assignedClasses: { $each: admin.assignedClasses } } });
  } else {
    await ClassModel.updateMany({ assignedProfessor: admin._id }, { $unset: { assignedProfessor: 1 } });
  }

  await User.findByIdAndDelete(admin._id);
  return res.json({ message: "Professor fired successfully" });
}

export async function transferProfessor(req, res) {
  const { classId, toProfessorId } = req.body;
  if (!classId || !toProfessorId) {
    return res.status(400).json({ message: "classId and toProfessorId are required" });
  }

  const [classDoc, toProfessor] = await Promise.all([
    ClassModel.findById(classId),
    User.findOne({ _id: toProfessorId, role: "admin" })
  ]);

  if (!classDoc) return res.status(404).json({ message: "Class not found" });
  if (!toProfessor) return res.status(404).json({ message: "Target professor not found" });

  const prevProfessorId = classDoc.assignedProfessor?.toString();
  classDoc.assignedProfessor = toProfessor._id;
  await classDoc.save();

  if (prevProfessorId && prevProfessorId !== toProfessor._id.toString()) {
    await User.findByIdAndUpdate(prevProfessorId, { $pull: { assignedClasses: classDoc._id } });
  }
  await User.findByIdAndUpdate(toProfessor._id, { $addToSet: { assignedClasses: classDoc._id } });

  return res.json({ message: "Professor transferred successfully" });
}
