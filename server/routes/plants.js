// server/routes/plants.js

import express from "express";
import upload from "../helpers/multer.js";
import cloudinary from "../helpers/cloudinary.js";
import supabase from "../db.js";
import requireAdmin from "../middleware/requireAdmin.js";
import fs from "fs";
import QRCode from "qrcode";

const router = express.Router();

/* ---------------- GET ALL PLANTS (PUBLIC) ---------------- */
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

/* ---------------- GET SINGLE PLANT (PUBLIC) ---------------- */
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

/* ---------------- ADD PLANT (ADMIN) ---------------- */
router.post("/", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, description, category, scientific_name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Plant name required" });
    }

    let image_url = null;
    let image_public_id = null;

    if (req.file) {
      const img = await cloudinary.uploader.upload(req.file.path, {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
      });
      image_url = img.secure_url;
      image_public_id = img.public_id;
      fs.unlinkSync(req.file.path);
    }

    // 1️⃣ Insert plant
    const { data: plant, error } = await supabase
      .from("plants")
      .insert([
        {
          name,
          scientific_name: scientific_name || null,
          description,
          category: category || null,
          image_url,
          image_public_id
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // 2️⃣ Generate QR (BLOCKING — REQUIRED)
    const frontendURL =
      process.env.FRONTEND_URL ||
      "https://mygardenbook-frontend.vercel.app";

    const qrDataURL = await QRCode.toDataURL(
      `${frontendURL}/PlantView.html?id=${plant.id}`
    );

    const qrUpload = await cloudinary.uploader.upload(qrDataURL, {
      folder: "mygardenbook/qr"
    });

    // 3️⃣ Update plant with QR
    await supabase
      .from("plants")
      .update({
        qr_code_url: qrUpload.secure_url,
        qr_public_id: qrUpload.public_id
      })
      .eq("id", plant.id);

    // 4️⃣ Fetch updated plant (WITH QR)
    const { data: updatedPlant } = await supabase
      .from("plants")
      .select("*")
      .eq("id", plant.id)
      .single();

    // 5️⃣ Respond ONCE (frontend gets QR immediately)
    res.json({ success: true, plant: updatedPlant });

  } catch (err) {
    console.error("Add plant error:", err);
    res.status(500).json({ error: "Failed to add plant" });
  }
});

/* ---------------- UPDATE PLANT (ADMIN) ---------------- */
router.put("/:id", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const update = {
      name: req.body.name,
      scientific_name: req.body.scientific_name,
      description: req.body.description,
      category: req.body.category || null
    };

    Object.keys(update).forEach(
      key => update[key] === undefined && delete update[key]
    );

    if (req.file) {
      const img = await cloudinary.uploader.upload(req.file.path, {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
      });
      update.image_url = img.secure_url;
      update.image_public_id = img.public_id;
      fs.unlinkSync(req.file.path);
    }

    const { data: plant, error } = await supabase
      .from("plants")
      .update(update)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, plant });
  } catch (err) {
    console.error("Update plant error:", err);
    res.status(500).json({ error: "Failed to update plant" });
  }
});

/* ---------------- DELETE PLANT (ADMIN) ---------------- */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { data: plant, error } = await supabase
      .from("plants")
      .select("image_public_id, qr_public_id")
      .eq("id", req.params.id)
      .single();

    if (error || !plant) {
      return res.status(404).json({ error: "Plant not found" });
    }

    if (plant.image_public_id) {
      await cloudinary.uploader.destroy(plant.image_public_id);
    }

    if (plant.qr_public_id) {
      await cloudinary.uploader.destroy(plant.qr_public_id);
    }

    await supabase.from("plants").delete().eq("id", req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete plant error:", err);
    res.status(500).json({ error: "Failed to delete plant" });
  }
});

export default router;
