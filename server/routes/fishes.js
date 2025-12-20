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

    // 🔴 CRITICAL FIX — prevent browser / CDN caching
    res.setHeader("Cache-Control", "no-store");

    res.json(data);
  } catch {
    res.status(404).json({ error: "Fish not found" });
  }
});

/* ---------------- ADD FISH (ADMIN) ---------------- */
router.post("/", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, category, description, scientific_name } = req.body;
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

    // 1️⃣ Insert fish
    const { data: fish, error } = await supabase
      .from("fish")
      .insert([
        {
          name,
          scientific_name: scientific_name || null,
          category: category || null,
          description,
          image_url,
          image_public_id
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // 2️⃣ Generate QR (BLOCKING — REQUIRED)
    const frontendURL =
      process.env.FRONTEND_URL || "https://mygardenbook-frontend.vercel.app";

    const qrDataURL = await QRCode.toDataURL(
      `${frontendURL}/FishView.html?id=${fish.id}`
    );

    const qrUpload = await cloudinary.uploader.upload(qrDataURL, {
      folder: "mygardenbook/qr"
    });

    // 3️⃣ Update fish with QR
    await supabase
      .from("fish")
      .update({
        qr_code_url: qrUpload.secure_url,
        qr_public_id: qrUpload.public_id
      })
      .eq("id", fish.id);

    // 4️⃣ Fetch updated fish (WITH QR)
    const { data: updatedFish } = await supabase
      .from("fish")
      .select("*")
      .eq("id", fish.id)
      .single();

    // 5️⃣ Respond once (frontend gets QR instantly)
    res.json({ success: true, fish: updatedFish });

  } catch (err) {
    console.error("Add fish error:", err);
    res.status(500).json({ error: "Failed to add fish" });
  }
});

/* ---------------- UPDATE FISH (ADMIN) ---------------- */
router.put("/:id", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const update = {
      name: req.body.name,
      scientific_name: req.body.scientific_name,
      category: req.body.category || null,
      description: req.body.description
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

    // 🔥 DELETE FISH IMAGE
    if (fish.image_public_id) {
      await cloudinary.uploader.destroy(fish.image_public_id, {
        resource_type: "image",
        invalidate: true
      });
    }

    // 🔥 DELETE QR IMAGE
    if (fish.qr_public_id) {
      await cloudinary.uploader.destroy(fish.qr_public_id, {
        resource_type: "image",
        invalidate: true
      });
    }

    // 🔥 DELETE DB ROW
    await supabase.from("fish").delete().eq("id", req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete fish error:", err);
    res.status(500).json({ error: "Failed to delete fish" });
  }
});


export default router;
