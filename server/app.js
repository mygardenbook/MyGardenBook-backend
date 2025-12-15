// server/app.js

import "dotenv/config";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

// ROUTES
import plantsRoutes from "./routes/plants.js";
import fishRoutes from "./routes/fishes.js";
import categoriesRoutes from "./routes/categories.js";
import exportRoutes from "./routes/export.js";

const app = express();

/* -------------------------------------------
   CORS CONFIG (Render + Vercel + Local)
--------------------------------------------- */

const PROD_FRONTEND = process.env.FRONTEND_URL;

const VERCEL_PREVIEW_REGEX =
  /^https:\/\/my-garden-book-frontend-.*\.vercel\.app$/;

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  PROD_FRONTEND
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, Postman, curl
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (VERCEL_PREVIEW_REGEX.test(origin)) return callback(null, true);

      return callback(new Error("CORS blocked: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  })
);

/* -------------------------------------------
   MIDDLEWARE
--------------------------------------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------------------------------
   AI ROUTE (Groq) — FINAL FIX
--------------------------------------------- */

app.post("/api/ask-ai", async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY missing" });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Question is required" });
    }

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          // ✅ STABLE, SUPPORTED MODEL (DO NOT CHANGE)
          model: "mixtral-8x7b-32768",
          messages: [
            {
              role: "system",
              content:
                context ||
                "You are a helpful assistant for a gardening and aquarium application."
            },
            { role: "user", content: question }
          ],
          temperature: 0.6
        })
      }
    );

    const json = await groqRes.json();

    console.log("===== GROQ DEBUG =====");
    console.log("HTTP STATUS:", groqRes.status);
    console.log("RESPONSE:", JSON.stringify(json, null, 2));
    console.log("======================");

    if (!groqRes.ok || json.error) {
      return res.status(500).json({
        error: "Groq API error",
        details: json.error || json
      });
    }

    if (!json.choices || !json.choices.length) {
      return res.status(500).json({
        error: "Groq returned no choices",
        raw: json
      });
    }

    res.json({
      answer: json.choices[0].message.content
    });
  } catch (err) {
    console.error("AI route crash:", err);
    res.status(500).json({ error: "AI backend error" });
  }
});

/* -------------------------------------------
   API ROUTES
--------------------------------------------- */

app.use("/api/plants", plantsRoutes);
app.use("/api/fish", fishRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/export", exportRoutes);

/* -------------------------------------------
   HEALTH CHECK
--------------------------------------------- */

app.get("/", (req, res) => {
  res.send("MyGardenBook backend is running 🚀");
});

/* -------------------------------------------
   SERVER START
--------------------------------------------- */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
