// server/routes/categories.js — Final Clean Version

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const categoriesFile = path.join(__dirname, "../data/categories.json");

// 🧩 Ensure file exists
if (!fs.existsSync(categoriesFile)) {
  fs.writeFileSync(categoriesFile, "[]", "utf-8");
}

// 🧠 Helper functions
const readCategories = () => {
  try {
    const data = fs.readFileSync(categoriesFile, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading categories.json:", err);
    return [];
  }
};

const writeCategories = (categories) => {
  try {
    fs.writeFileSync(categoriesFile, JSON.stringify(categories, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing categories.json:", err);
  }
};

// ------------------------------------------------------
// 📜 GET ALL CATEGORIES
// ------------------------------------------------------
router.get("/", (req, res) => {
  try {
    const categories = readCategories();
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// ------------------------------------------------------
// ➕ ADD NEW CATEGORY
// ------------------------------------------------------
router.post("/", (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Category name is required" });

    const categories = readCategories();

    const exists = categories.some(
      (cat) => cat.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (exists) return res.status(400).json({ message: "Category already exists" });

    const newCategory = { id: Date.now(), name: name.trim() };
    categories.push(newCategory);

    writeCategories(categories);
    res.status(201).json(newCategory);
  } catch (err) {
    console.error("Error adding category:", err);
    res.status(500).json({ message: "Failed to add category" });
  }
});

// ------------------------------------------------------
// ❌ DELETE CATEGORY
// ------------------------------------------------------
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const categories = readCategories();

    const index = categories.findIndex((cat) => cat.id === Number(id));
    if (index === -1) return res.status(404).json({ message: "Category not found" });

    categories.splice(index, 1);
    writeCategories(categories);

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Error deleting category:", err);
    res.status(500).json({ message: "Failed to delete category" });
  }
});

export default router;
