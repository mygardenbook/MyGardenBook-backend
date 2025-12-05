import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import plantsRoutes from "./routes/plants.js";
import fishRoutes from "./routes/fish.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";


dotenv.config();

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", process.env.FRONTEND_URL],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/plants", plantsRoutes);
app.use("/api/fish", fishRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);  


app.get("/", (req, res) => {
  res.send("MyGardenBook backend is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
