import jwt from "jsonwebtoken";
import User from "../models/User.js";

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  });
}

export async function bootstrapSuperAdmin(req, res) {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    return res.status(400).json({ message: "Super admin bootstrap is closed" });
  }

  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "fullName, email, and password are required" });
  }

  const user = await User.create({ fullName, email, password, role: "superadmin" });
  return res.status(201).json({
    message: "Super admin created",
    token: signToken(user._id),
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.json({
    token: signToken(user._id),
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
  });
}

export async function me(req, res) {
  return res.json({ user: req.user });
}
