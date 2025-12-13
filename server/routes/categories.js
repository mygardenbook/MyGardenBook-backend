// server/routes/categories.js

import express from "express";
import supabase from "../db.js";

const router = express.Router();

/* -------------------------------------------
   GET ALL CATEGORIES
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
   ADD CATEGORY
--------------------------------------------- */
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name required" });
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([{ name: name.trim() }])
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
   DELETE CATEGORY
--------------------------------------------- */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error("Category delete error:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
