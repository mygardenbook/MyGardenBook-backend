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
  } catch (err) {
    console.error(err);
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
    const { name, scientific_name, description, category } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Plant name required" });
    }

    let image_url = null;

    // Upload image to Cloudinary
    if (req.file) {
      const img = await cloudinary.uploader.upload(req.file.path, {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
      });
      image_url = img.secure_url;
      fs.unlinkSync(req.file.path);
    }

    // Insert plant
    const { data: plant, error } = await supabase
      .from("plants")
      .insert([
        { name, scientific_name, description, category, image_url }
      ])
      .select()
      .single();

    if (error) throw error;

    // Safe frontend URL
    const frontendURL =
      process.env.FRONTEND_URL || "https://mygardenbook-frontend.vercel.app";

    // Generate QR as buffer
    const qrBuffer = await QRCode.toBuffer(
      `${frontendURL}/PlantView.html?id=${plant.id}`
    );

    // Upload QR to Cloudinary
    const qrUpload = await cloudinary.uploader.upload(
      `data:image/png;base64,${qrBuffer.toString("base64")}`,
      { folder: "mygardenbook/qr" }
    );

    // Save QR URL
    await supabase
      .from("plants")
      .update({ qr_code_url: qrUpload.secure_url })
      .eq("id", plant.id);

    res.json({
      success: true,
      plant: { ...plant, qr_code_url: qrUpload.secure_url }
    });

  } catch (err) {
    console.error("Add plant error:", err);
    res.status(500).json({ error: "Failed to add plant" });
  }
});

/* ---------------- UPDATE PLANT (ADMIN) ---------------- */
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

    const { data: plant, error } = await supabase
      .from("plants")
      .update(update)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Ensure QR exists
    if (!plant.qr_code_url) {
      const frontendURL =
        process.env.FRONTEND_URL || "https://mygardenbook-frontend.vercel.app";

      const qrBuffer = await QRCode.toBuffer(
        `${frontendURL}/PlantView.html?id=${plant.id}`
      );

      const qrUpload = await cloudinary.uploader.upload(
        `data:image/png;base64,${qrBuffer.toString("base64")}`,
        { folder: "mygardenbook/qr" }
      );

      await supabase
        .from("plants")
        .update({ qr_code_url: qrUpload.secure_url })
        .eq("id", plant.id);

      plant.qr_code_url = qrUpload.secure_url;
    }

    res.json({ success: true, plant });

  } catch (err) {
    console.error("Update plant error:", err);
    res.status(500).json({ error: "Failed to update plant" });
  }
});

export default router;
