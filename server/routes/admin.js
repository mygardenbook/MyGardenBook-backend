import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import supabase from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET_KEY || "change_this_secret_in_prod";
const SALT_ROUNDS = 10;

// Helper: create token
function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Middleware to protect routes
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Register admin (use once, then remove or protect)
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email & password required" });

    // check exists
    const { data: existing, error: qerr } = await supabase.from("admin_users").select("*").eq("email", email).limit(1);
    if (qerr) return res.status(500).json({ error: qerr });
    if (existing && existing.length > 0) return res.status(400).json({ error: "Admin already exists" });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { data, error } = await supabase.from("admin_users").insert([{ email, password_hash: hash }]).select();

    if (error) return res.status(500).json({ error });
    res.json({ message: "Admin created", admin: { id: data[0].id, email: data[0].email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email & password required" });

    const { data, error } = await supabase.from("admin_users").select("*").eq("email", email).limit(1);
    if (error) return res.status(500).json({ error });
    if (!data || data.length === 0) return res.status(400).json({ error: "Invalid credentials" });

    const admin = data[0];
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = createToken({ id: admin.id, email: admin.email });
    res.json({ message: "Logged in", token, admin: { id: admin.id, email: admin.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example protected route to get all admin users (only accessible with token)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const adminId = req.admin.id;
    const { data, error } = await supabase.from("admin_users").select("id,email,created_at").eq("id", adminId).single();
    if (error) return res.status(500).json({ error });
    res.json({ admin: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
