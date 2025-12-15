// server/routes/categories.js

import express from "express";
import supabase from "../db.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

/* ---------------- GET ALL CATEGORIES (PUBLIC) ---------------- */
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

/* ---------------- ADD CATEGORY (ADMIN) ---------------- */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: "Category name required" });
    }

    const { error } = await supabase
      .from("categories")
      .insert([{ name: name.trim() }]);

    if (error) throw error;

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(409).json({ error: "Category already exists" });
  }
});

export default router;
