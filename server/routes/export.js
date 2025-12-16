import express from "express";
import supabase from "../db.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

router.get("/", requireAdmin, async (_, res) => {
  const [plants, fish] = await Promise.all([
    supabase.from("plants").select("*"),
    supabase.from("fish").select("*")
  ]);

  if (plants.error || fish.error)
    return res.status(500).json({ error: "Export failed" });

  const rows = [["TYPE","ID","NAME","CATEGORY","DESCRIPTION","IMAGE_URL"]];

  plants.data.forEach(p =>
    rows.push(["PLANT", p.id, p.name, p.category, p.description, p.image_url])
  );

  fish.data.forEach(f =>
    rows.push(["FISH", f.id, f.name, f.category, f.description, f.image_url])
  );

  const csv = rows.map(r => r.map(v => `"${v ?? ""}"`).join(",")).join("\n");

  res.setHeader("Content-Type","text/csv");
  res.setHeader("Content-Disposition","attachment; filename=MyGardenBook.csv");
  res.send(csv);
});

export default router;
