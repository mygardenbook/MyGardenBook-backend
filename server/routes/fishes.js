// server/routes/fishes.js
import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
  try {
    const fishes = db.prepare("SELECT * FROM fishes ORDER BY id DESC").all();
    res.json(fishes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load fishes" });
  }
});

router.post("/", (req, res) => {
  try {
    const { commonName, scientificName, category, description, image, qr } = req.body;
    const info = db
      .prepare(`INSERT INTO fishes (commonName, scientificName, category, description, image, qr)
                VALUES (?, ?, ?, ?, ?, ?)`)
      .run(commonName, scientificName, category, description, image, qr);
    res.json({ message: "Fish added", id: info.lastInsertRowid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add fish" });
  }
});

router.put("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { commonName, scientificName, category, description, image, qr } = req.body;
    db.prepare(`
      UPDATE fishes SET commonName=?, scientificName=?, category=?, description=?, image=?, qr=? WHERE id=?
    `).run(commonName, scientificName, category, description, image, qr, id);
    res.json({ message: "Fish updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update fish" });
  }
});

router.delete("/", (req, res) => {
  try {
    const { ids } = req.body;
    const stmt = db.prepare(`DELETE FROM fishes WHERE id=?`);
    const transaction = db.transaction(ids.map(id => () => stmt.run(id)));
    transaction();
    res.json({ message: "Fishes deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete fishes" });
  }
});

export default router;
