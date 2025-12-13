import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import plantsRoutes from "./routes/plants.js";
import fishRoutes from "./routes/fishes.js";
import adminRoutes from "./routes/admin.js";
import categoriesRoutes from "./routes/categories.js";
app.use("/api/categories", categoriesRoutes);

import fetch from "node-fetch"; // ✅ required for AI route

dotenv.config();

const app = express();

/* -------------------------------------------
   FIXED CORS CONFIGURATION FOR RENDER + VERCEL
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
   EXPRESS MIDDLEWARE
--------------------------------------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------------------------------
   AI ROUTE (Groq)
--------------------------------------------- */

app.post("/api/ask-ai", async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          { role: "system", content: context || "" },
          { role: "user", content: question }
        ],
        temperature: 0.6
      })
    });

    const json = await groqRes.json();
    const answer =
      json?.choices?.[0]?.message?.content ||
      "AI did not return a response.";

    res.json({ answer });

  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "AI backend error" });
  }
});

/* -------------------------------------------
   ROUTES
--------------------------------------------- */

app.use("/api/plants", plantsRoutes);
app.use("/api/fish", fishRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoriesRoutes);   // ✅ REQUIRED

app.get("/", (req, res) => {
  res.send("MyGardenBook backend is running!");
});

/* -------------------------------------------
   SERVER START
--------------------------------------------- */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
