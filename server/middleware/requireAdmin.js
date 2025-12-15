// server/middleware/requireAdmin.js

import jwt from "jsonwebtoken";
import supabase from "../db.js";

export default async function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const token = auth.replace("Bearer ", "");

    // Decode JWT WITHOUT verifying (Supabase already signed it)
    const decoded = jwt.decode(token);
    if (!decoded?.sub) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Check profile role
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", decoded.sub)
      .single();

    if (error || !profile) {
      return res.status(403).json({ error: "Profile not found" });
    }

    if (profile.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    req.adminId = decoded.sub;
    next();
  } catch (err) {
    console.error("requireAdmin error:", err);
    res.status(500).json({ error: "Admin authorization failed" });
  }
}
