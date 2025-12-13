import express from "express";
import upload from "../helpers/multer.js";
import cloudinary from "../helpers/cloudinary.js";
import supabase from "../db.js";
import fs from "fs";
import QRCode from "qrcode";

const router = express.Router();

/* ---------------- GET ALL FISHES ---------------- */
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("fishes")
    .select("*")
    .order("id", { ascending: false });

  if (error) return res.status(500).json({ error: "Failed to load fishes" });
  res.json(data);
});

/* ---------------- GET SINGLE FISH ---------------- */
router.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("fishes")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error) return res.status(404).json({ error: "Fish not found" });
  res.json(data);
});

/* ---------------- ADD FISH ---------------- */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, scientific_name, category, description } = req.body;
    if (!name) return res.status(400).json({ success: false });

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

    const qr_code_url = await QRCode.toDataURL(
      `${process.env.FRONTEND_URL}/FishView.html?id=${fish.id}`
    );

    await supabase
      .from("fishes")
      .update({ qr_code_url })
      .eq("id", fish.id);

    res.json({ success: true, item: { ...fish, qr_code_url } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ---------------- UPDATE FISH ---------------- */
router.post("/edit/:id", upload.single("image"), async (req, res) => {
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
      .from("fishes")
      .update(update)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, item: data });

  } catch {
    res.status(500).json({ success: false });
  }
});

/* ---------------- DELETE MULTIPLE ---------------- */
router.delete("/", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: "Invalid ids" });

  const { error } = await supabase.from("fishes").delete().in("id", ids);
  if (error) return res.status(500).json({ error: "Delete failed" });

  res.json({ success: true });
});

export default router;
