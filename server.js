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

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['https://next-crm-frontend.vercel.app'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

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


