// server/routes/fishes.js

import express from "express";
import upload from "../helpers/multer.js";
import cloudinary from "../helpers/cloudinary.js";
import supabase from "../db.js";
import requireAdmin from "../middleware/requireAdmin.js";
import fs from "fs";
import QRCode from "qrcode";

const router = express.Router();

/* ---------------- GET ALL FISHES (PUBLIC) ---------------- */
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("fishes")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to load fishes" });
  }
});

/* ---------------- GET SINGLE FISH (PUBLIC) ---------------- */
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("fishes")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch {
    res.status(404).json({ error: "Fish not found" });
  }
});

/* ---------------- ADD FISH (ADMIN) ---------------- */
router.post("/", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, scientific_name, category, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Fish name required" });
    }

    let image_url = null;

    if (req.file) {
      const img = await cloudinary.uploader.upload(req.file.path, {
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
      });
      image_url = img.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const { data: fish, error } = await supabase
      .from("fishes")
      .insert([{ name, scientific_name, category, description, image_url }])
      .select()
      .single();

    if (error) throw error;

    const frontendURL =
      process.env.FRONTEND_URL || "https://mygardenbook-frontend.vercel.app";

    const qrBuffer = await QRCode.toBuffer(
      `${frontendURL}/FishView.html?id=${fish.id}`
    );

    const qrUpload = await cloudinary.uploader.upload(
      `data:image/png;base64,${qrBuffer.toString("base64")}`,
      { folder: "mygardenbook/qr" }
    );

    await supabase
      .from("fishes")
      .update({ qr_code_url: qrUpload.secure_url })
      .eq("id", fish.id);

    res.json({
      success: true,
      fish: { ...fish, qr_code_url: qrUpload.secure_url }
    });

  } catch (err) {
    console.error("Add fish error:", err);
    res.status(500).json({ error: "Failed to add fish" });
  }
});

/* ---------------- UPDATE FISH (ADMIN) ---------------- */
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

    const { data: fish, error } = await supabase
      .from("fishes")
      .update(update)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, fish });

  } catch {
    res.status(500).json({ error: "Failed to update fish" });
  }
});

export default router;
