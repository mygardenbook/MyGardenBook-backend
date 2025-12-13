import express from "express";
import upload from "../helpers/multer.js";
import cloudinary from "../helpers/cloudinary.js";
import supabase from "../db.js";
import requireAdmin from "../middleware/requireAdmin.js";
import fs from "fs";
import QRCode from "qrcode";

const router = express.Router();

/* ------------------ GET ALL PLANTS (PUBLIC) ------------------ */
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

/* ------------------ GET SINGLE PLANT (PUBLIC) ------------------ */
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

/* ------------------ ADD PLANT (ADMIN) ------------------ */
router.post("/", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, description, category } = req.body;
    if (!name) return res.status(400).json({ error: "Plant name required" });

    let image_url = null;

    if (req.file) {
      const img = await cloudinary.uploader.upload(req.file.path, {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
      });
      image_url = img.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const { data: plant, error } = await supabase
      .from("plants")
      .insert([{ name, description, category, image_url }])
      .select()
      .single();

    if (error) throw error;

    const qr_code_url = await QRCode.toDataURL(
      `${process.env.FRONTEND_URL}/PlantView.html?id=${plant.id}`
    );

    await supabase.from("plants").update({ qr_code_url }).eq("id", plant.id);

    res.json({ success: true, plant: { ...plant, qr_code_url } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add plant" });
  }
});

/* ------------------ UPDATE PLANT (ADMIN) ------------------ */
router.put("/:id", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const update = { ...req.body };

    if (req.file) {
      const img = await cloudinary.uploader.upload(req.file.path, {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
      });
      update.image_url = img.secure_url;
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

export default router;
