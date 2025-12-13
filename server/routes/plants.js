import express from "express";
import upload from "../helpers/multer.js";
import cloudinary from "../helpers/cloudinary.js";
import supabase from "../db.js";
import fs from "fs";

const router = express.Router();

/* ------------------ GET ALL PLANTS ------------------ */
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("plants")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to load plants" });
  }
});

/* ------------------ GET SINGLE PLANT ------------------ */
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("plants")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch {
    res.status(404).json({ error: "Plant not found" });
  }
});

/* ------------------ ADD PLANT ------------------ */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, description, category } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Plant name required" });
    }

    let image_url = null;

    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
      });
      image_url = uploadRes.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const { data, error } = await supabase
      .from("plants")
      .insert([{ name, description, category, image_url }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, plant: data });
  } catch {
    res.status(500).json({ error: "Failed to add plant" });
  }
});

/* ------------------ UPDATE PLANT ------------------ */
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const update = {};
    const { name, description, category } = req.body;

    if (name) update.name = name;
    if (description) update.description = description;
    if (category) update.category = category;

    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
      });
      update.image_url = uploadRes.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const { data, error } = await supabase
      .from("plants")
      .update(update)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, plant: data });
  } catch {
    res.status(500).json({ error: "Failed to update plant" });
  }
});

/* ------------------ DELETE PLANT ------------------ */
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("plants")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete plant" });
  }
});

export default router;
