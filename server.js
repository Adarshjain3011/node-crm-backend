import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

// Routes
import clientEnqueryRoutes from "./src/routes/clientEnquery.route.js";
import userRoutes from "./src/routes/user.route.js";
import quoteRoutes from "./src/routes/quote.route.js";
import authRoutes from "./src/routes/auth.route.js";
import invoiceRoutes from "./src/routes/invoice.route.js";

import orderRoutes from "./src/routes/order.route.js";

// Config
import dbConnect from "./src/config/db.config.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ───────────────── Middlewares ─────────────────
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.use(cors({
  origin: "http://localhost:3000", // Your frontend URL
  credentials: true,
}));

app.use(cookieParser());

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  debug: false,
}));

// ───────────────── Routes ─────────────────
app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.use("/api", clientEnqueryRoutes);
app.use("/api", userRoutes);
app.use("/api", quoteRoutes);
app.use("/api", authRoutes);

app.use("/api", invoiceRoutes);

app.use("/api", orderRoutes);



// ───────────────── 404 Handler ─────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ───────────────── Error Handler ─────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ───────────────── Server Start ─────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

// Connect to DB
dbConnect();


