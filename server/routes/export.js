import express from "express";
import supabase from "../db.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

router.get("/", requireAdmin, async (req, res) => {
  try {
    const [plants, fishes, categories] = await Promise.all([
      supabase.from("plants").select("*"),
      supabase.from("fishes").select("*"),
      supabase.from("categories").select("*")
    ]);

    const rows = [];

    rows.push(["TYPE", "ID", "NAME", "SCIENTIFIC_NAME", "CATEGORY", "DESCRIPTION", "IMAGE_URL"]);

    plants.data.forEach(p => {
      rows.push([
        "PLANT",
        p.id,
        p.name,
        p.scientific_name,
        p.category,
        p.description,
        p.image_url
      ]);
    });

    fishes.data.forEach(f => {
      rows.push([
        "FISH",
        f.id,
        f.name,
        f.scientific_name,
        f.category,
        f.description,
        f.image_url
      ]);
    });

    const csv = rows.map(r =>
      r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=MyGardenBook_Data.csv");
    res.send(csv);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Export failed" });
  }
});

export default router;
