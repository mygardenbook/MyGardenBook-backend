// server/routes/categories.js

import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* -------------------------------------------
   GET ALL CATEGORIES
--------------------------------------------- */
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Categories fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }

  res.json(data);
});

/* -------------------------------------------
   ADD CATEGORY
--------------------------------------------- */
router.post("/", async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name required" });
  }

  const { data, error } = await supabase
    .from("categories")
    .insert([{ name: name.trim() }])
    .select()
    .single();

  if (error) {
    console.error("Category insert error:", error);
    return res.status(500).json({ error: "Failed to add category" });
  }

  res.status(201).json(data);
});

/* -------------------------------------------
   DELETE CATEGORY
--------------------------------------------- */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Category delete error:", error);
    return res.status(500).json({ error: "Failed to delete category" });
  }

  res.json({ success: true });
});

export default router;
