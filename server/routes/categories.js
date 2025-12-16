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
  } catch {
    res.status(409).json({ error: "Category already exists" });
  }
});

/* ---------------- DELETE CATEGORY (ADMIN ONLY) ---------------- */
/*
  RULES:
  - Admin only
  - Block delete if plants OR fish exist with this category
  - No cascading deletes
*/
router.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Get category name
    const { data: category, error: catErr } = await supabase
      .from("categories")
      .select("id, name")
      .eq("id", id)
      .single();

    if (catErr || !category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const categoryName = category.name;

    // 2️⃣ Check plants using this category
    const { count: plantCount, error: plantErr } = await supabase
      .from("plants")
      .select("id", { count: "exact", head: true })
      .eq("category", categoryName);

    if (plantErr) throw plantErr;

    // 3️⃣ Check fish using this category
    const { count: fishCount, error: fishErr } = await supabase
      .from("fish")
      .select("id", { count: "exact", head: true })
      .eq("category", categoryName);

    if (fishErr) throw fishErr;

    // 4️⃣ Block if in use
    if ((plantCount || 0) > 0 || (fishCount || 0) > 0) {
      return res.status(409).json({
        error: "Category in use",
        details: {
          plants: plantCount || 0,
          fish: fishCount || 0
        }
      });
    }

    // 5️⃣ Safe to delete
    const { error: delErr } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (delErr) throw delErr;

    res.json({ success: true });
  } catch (err) {
    console.error("Category delete error:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
