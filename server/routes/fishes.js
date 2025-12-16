// server/routes/fishes.js

import express from "express";
import upload from "../helpers/multer.js";
import cloudinary from "../helpers/cloudinary.js";
import supabase from "../db.js";
import requireAdmin from "../middleware/requireAdmin.js";
import fs from "fs";
import QRCode from "qrcode";

const router = express.Router();

/* ---------------- GET ALL FISH (PUBLIC) ---------------- */
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("fish")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to load fish" });
  }
});

/* ---------------- GET SINGLE FISH (PUBLIC) ---------------- */
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("fish")
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
    const { name, category, description } = req.body;
    if (!name) return res.status(400).json({ error: "Fish name required" });

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

    const { data: fish, error } = await supabase
      .from("fish")
      .insert([
        {
          name,
          category,
          description,
          image_url,
          image_public_id
        }
      ])
      .select()
      .single();

    if (error) throw error;

    const frontendURL =
      process.env.FRONTEND_URL || "https://mygardenbook-frontend.vercel.app";

    const qrDataURL = await QRCode.toDataURL(
      `${frontendURL}/FishView.html?id=${fish.id}`
    );

    const qrUpload = await cloudinary.uploader.upload(qrDataURL, {
      folder: "mygardenbook/qr"
    });

    await supabase
      .from("fish")
      .update({
        qr_code_url: qrUpload.secure_url,
        qr_public_id: qrUpload.public_id
      })
      .eq("id", fish.id);

    res.json({ success: true, fish });
  } catch (err) {
    console.error("Add fish error:", err);
    res.status(500).json({ error: "Failed to add fish" });
  }
});

/* ---------------- UPDATE FISH (ADMIN) ---------------- */
router.put("/:id", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const update = { ...req.body };
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

    const { data: fish, error } = await supabase
      .from("fish")
      .update(update)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, fish });
  } catch (err) {
    console.error("Update fish error:", err);
    res.status(500).json({ error: "Failed to update fish" });
  }
});

/* ---------------- DELETE FISH (ADMIN) ---------------- */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { data: fish, error } = await supabase
      .from("fish")
      .select("image_public_id, qr_public_id")
      .eq("id", req.params.id)
      .single();

    if (error || !fish) {
      return res.status(404).json({ error: "Fish not found" });
    }

    if (fish.image_public_id) {
      await cloudinary.uploader.destroy(fish.image_public_id);
    }

    if (fish.qr_public_id) {
      await cloudinary.uploader.destroy(fish.qr_public_id);
    }

    await supabase.from("fish").delete().eq("id", req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete fish error:", err);
    res.status(500).json({ error: "Failed to delete fish" });
  }
});

export default router;
