// server/routes/categories.js

import express from "express";
import supabase from "../db.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

/* -------------------------------------------
   GET ALL CATEGORIES (PUBLIC)
--------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Categories fetch error:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

/* -------------------------------------------
   ADD CATEGORY (ADMIN)
--------------------------------------------- */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name required" });
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([{ name: name.trim(), type }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("Category insert error:", err);
    res.status(500).json({ error: "Failed to add category" });
  }
});

/* -------------------------------------------
   DELETE CATEGORY (ADMIN)
--------------------------------------------- */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Category delete error:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
