import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { handleAnalyzeRequest, handleAskRequest } from "./src/api/analyze.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "2mb" }));

// API Endpoints
app.post("/api/analyze", async (req, res) => {
  try {
    const result = await handleAnalyzeRequest(req.body);
    res.status(result.status).json(result.data);
  } catch (error) {
    console.error("Unhandled error in /api/analyze:", error);
    res.status(500).json({
      error: "YarnMe server encountered an unexpected error. Please try again.",
    });
  }
});

app.post("/api/ask", async (req, res) => {
  try {
    const result = await handleAskRequest(req.body);
    res.status(result.status).json(result.data);
  } catch (error) {
    console.error("Unhandled error in /api/ask:", error);
    res.status(500).json({
      error: "Failed to answer question.",
    });
  }
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "YarnMe" });
});

// Production static assets
const distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));

// SPA fallback for all remaining routes
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[YarnMe] Server running on http://0.0.0.0:${PORT}`);
});
