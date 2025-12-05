// routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db.js"; // adjust path if necessary
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "replace_this_secret";
const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10");

// Register route
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success:false, message: "Email and password required" });

    // check existing
    const exists = await db.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ success:false, message: "Email already registered" });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const insert = await db.query(
      "INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) RETURNING id, name, email, created_at",
      [name || null, email.toLowerCase(), password_hash]
    );

    const user = insert.rows[0];

    // sign token
    const token = jwt.sign({ sub: user.id, role: "user", email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    console.error("REGISTER ERR", err);
    res.status(500).json({ success:false, message: "Server error" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success:false, message: "Email and password required" });

    // try normal users table first
    const q = await db.query("SELECT id, name, email, password_hash FROM users WHERE email = $1", [email.toLowerCase()]);
    let user = q.rows[0];

    // fallback: admin_users (so admins can login here too)
    let role = "user";
    if (!user) {
      const adm = await db.query("SELECT id, email, password_hash FROM admin_users WHERE email = $1", [email.toLowerCase()]);
      if (adm.rows[0]) {
        user = adm.rows[0];
        role = "admin";
      }
    }

    if (!user) return res.status(401).json({ success:false, message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ success:false, message: "Invalid credentials" });

    // sign token
    const token = jwt.sign({ sub: user.id, role, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      user: { id: user.id, name: user.name || null, email: user.email },
      role,
      token
    });
  } catch (err) {
    console.error("LOGIN ERR", err);
    res.status(500).json({ success:false, message: "Server error" });
  }
});

// GET /me - token required
router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ success:false, message: "Unauthorized" });

    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);

    // fetch user row depending on role
    if (payload.role === "admin") {
      const adm = await db.query("SELECT id,email FROM admin_users WHERE id = $1", [payload.sub]);
      if (!adm.rows[0]) return res.status(404).json({ success:false, message: "Admin not found" });
      return res.json({ success:true, user: { id: adm.rows[0].id, email: adm.rows[0].email }, role: "admin" });
    } else {
      const u = await db.query("SELECT id,name,email FROM users WHERE id = $1", [payload.sub]);
      if (!u.rows[0]) return res.status(404).json({ success:false, message: "User not found" });
      return res.json({ success:true, user: u.rows[0], role: "user" });
    }
  } catch (err) {
    console.error("ME ERR", err);
    res.status(401).json({ success:false, message: "Invalid token" });
  }
});

export default router;
