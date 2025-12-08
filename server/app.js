import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import plantsRoutes from "./routes/plants.js";
import fishRoutes from "./routes/fish.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();

/* -------------------------------------------
   FIXED CORS CONFIGURATION FOR RENDER + VERCEL
--------------------------------------------- */

// PRODUCTION FRONTEND URL
const PROD_FRONTEND =
  "https://my-garden-book-frontend.vercel.app";

// PREVIEW DEPLOYMENTS (Vercel auto-generates these)
const VERCEL_PREVIEW_REGEX =
  /^https:\/\/my-garden-book-frontend-.*\.vercel\.app$/;

// Allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  PROD_FRONTEND
];

// CORS middleware with dynamic origin checking
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Allow exact matches
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Vercel preview deployments
      if (VERCEL_PREVIEW_REGEX.test(origin)) {
        return callback(null, true);
      }

      // Otherwise deny
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
   ROUTES
--------------------------------------------- */

app.use("/api/plants", plantsRoutes);
app.use("/api/fish", fishRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("MyGardenBook backend is running!");
});

/* -------------------------------------------
   SERVER START
--------------------------------------------- */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
