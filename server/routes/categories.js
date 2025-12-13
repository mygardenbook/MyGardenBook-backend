// server/routes/categories.js — SUPABASE VERSION (FINAL)

import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE // MUST use service role key server-side
);

/* -------------------------------------------
   GET ALL CATEGORIES
-------------------------------------------- */
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Supabase error:", error);
    return res.status(500).json({ message: "Failed to fetch categories" });
  }

  res.json(data);
});

/* -------------------------------------------
   ADD NEW CATEGORY
-------------------------------------------- */
router.post("/", async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim())
    return res.status(400).json({ message: "Category name required" });

  const { data, error } = await supabase
    .from("categories")
    .insert([{ name: name.trim() }])
    .select()
    .single();

  if (error) {
    console.error("Supabase error:", error);
    return res.status(500).json({ message: "Failed to add category" });
  }

  res.status(201).json(data);
});

/* -------------------------------------------
   DELETE CATEGORY
-------------------------------------------- */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Supabase error:", error);
    return res.status(500).json({ message: "Failed to delete category" });
  }

  res.json({ message: "Category deleted successfully" });
});

export default router;
