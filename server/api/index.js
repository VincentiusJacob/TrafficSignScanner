const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const axios = require("axios");

const app = express();

const openAIEndpoint =
  "https://vince-mb63mgbe-eastus2.cognitiveservices.azure.com";
const openAIKey =
  "C57BMul7SGrqi12ymNhUyoTaYnsAuuIajmgVpfW6EA5FHmyKa11eJQQJ99BEACHYHv6XJ3w3AAAAACOGf571";

// ⚠️ Di Vercel, Python path berbeda
const pythonPath = process.env.VERCEL
  ? "python3"
  : "/Users/vincentiusjacob/Documents/SignScanner/server/venv/bin/python3";

app.use((req, res, next) => {
  // Update CORS untuk production
  const allowedOrigins = [
    "http://localhost:5173",
    "https://your-vercel-app.vercel.app", // Ganti dengan domain Vercel kamu nanti
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

// ⚠️ Vercel menggunakan /tmp untuk temporary files
const storage = multer.diskStorage({
  destination: "/tmp/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

app.post("/api/predict", upload.single("image"), (req, res) => {
  const imagePath = req.file?.path;
  if (!imagePath) {
    console.log("❌ No image uploaded");
    return res.status(400).send("No image uploaded");
  }

  const stats = fs.statSync(imagePath);
  console.log(`📏 File saved: ${imagePath} (${stats.size} bytes)`);

  // ⚠️ Path ke predict.py perlu disesuaikan
  const scriptPath = path.join(__dirname, "../predict.py");
  const python = spawn(pythonPath, [scriptPath, imagePath]);

  let result = "";
  let errorMsg = "";

  python.stdout.on("data", (data) => {
    console.log("🐍 STDOUT:", data.toString());
    result += data.toString();
  });

  python.stderr.on("data", (data) => {
    console.error("⚠️ STDERR:", data.toString());
    errorMsg += data.toString();
  });

  python.on("error", (err) => {
    console.error("❌ Python process error:", err.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to start Python process" });
    }
  });

  python.on("close", (code) => {
    if (res.headersSent) return;

    const lines = result.trim().split("\n");
    const lastLine = lines[lines.length - 1].trim();

    if (code !== 0 || !lastLine) {
      console.error("❌ Python stderr:", errorMsg || "No error message");
      return res
        .status(500)
        .json({ error: errorMsg || "Python exited with error" });
    }

    console.log("✅ Clean prediction result:", lastLine);
    res.json({ prediction: lastLine });
  });
});

app.post("/api/get-sign-description", async (req, res) => {
  try {
    const { signName } = req.body;

    if (!signName) {
      return res.status(400).json({ error: "No sign name provided" });
    }

    const prompt = `Describe the following traffic sign in English: "${signName}".`;

    const response = await axios.post(
      `${openAIEndpoint}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-12-01-preview`,
      {
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
      }
    );

    const description = response.data.choices[0].message.content.trim();
    res.json({ description });
  } catch (error) {
    console.error("Error getting description from GPT-4:", error);
    res.status(500).json({ error: "Failed to fetch description from GPT-4" });
  }
});

// Export untuk Vercel
module.exports = app;
