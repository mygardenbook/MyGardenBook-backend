import express from "express";
import upload from "../helpers/multer.js";
import cloudinary from "../helpers/cloudinary.js";
import supabase from "../db.js";
import fs from "fs";

const router = express.Router();

// GET all plants
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("plants").select("*").order("id", { ascending: true });
    if (error) return res.status(500).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single plant
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { data, error } = await supabase.from("plants").select("*").eq("id", id).single();
    if (error) return res.status(404).json({ error });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a plant
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { name, description, category } = req.body;
    let image_url = null;

    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
      });
      image_url = uploadRes.secure_url;
      // cleanup tmp file
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }

    const payload = { name, description, image_url, category };
    const { data, error } = await supabase.from("plants").insert([payload]).select();

    if (error) return res.status(400).json({ error });
    res.json({ message: "Plant added", plant: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit plant
router.put("/edit/:id", upload.single("image"), async (req, res) => {
  try {
    const id = req.params.id;
    const { name, description, category } = req.body;
    let image_url;

    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
      });
      image_url = uploadRes.secure_url;
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }

    const updateObj = {};
    if (name !== undefined) updateObj.name = name;
    if (description !== undefined) updateObj.description = description;
    if (category !== undefined) updateObj.category = category;
    if (image_url) updateObj.image_url = image_url;
    updateObj.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from("plants").update(updateObj).eq("id", id).select();

    if (error) return res.status(400).json({ error });
    res.json({ message: "Plant updated", plant: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete plant
router.delete("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { data, error } = await supabase.from("plants").delete().eq("id", id).select();
    if (error) return res.status(400).json({ error });
    res.json({ message: "Plant deleted", plant: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
