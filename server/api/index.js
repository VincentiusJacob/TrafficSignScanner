const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const axios = require("axios");

const app = express();

const openAIEndpoint =
  "https://vince-mbmcn9kw-swedencentral.cognitiveservices.azure.com";
const openAIKey =
  "JwJT4BdMxNqsZgp8GFvbuusbUVeCsXL9Q8Xj6lI9GXENW1nEP0qbJQQJ99BFACfhMk5XJ3w3AAAAACOG05EX";

// CORS untuk semua origin (sementara untuk testing)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

// Multer untuk Vercel (gunakan /tmp)
const storage = multer.diskStorage({
  destination: "/tmp/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Prediction route (tanpa Python dulu untuk testing)
app.post("/api/predict", upload.single("image"), (req, res) => {
  console.log("Predict route hit");

  const imagePath = req.file?.path;
  if (!imagePath) {
    console.log("❌ No image uploaded");
    return res.status(400).json({ error: "No image uploaded" });
  }

  const stats = fs.statSync(imagePath);
  console.log(`📏 File saved: ${imagePath} (${stats.size} bytes)`);

  // Sementara return dummy response (tanpa Python)
  res.json({
    prediction: "Stop Sign",
    message: "Dummy response - Python script disabled for now",
    fileSize: stats.size,
  });
});

app.post("/api/get-sign-description", async (req, res) => {
  try {
    console.log("Description route hit");
    const { signName } = req.body;

    if (!signName) {
      return res.status(400).json({ error: "No sign name provided" });
    }

    const prompt = `Describe the following traffic sign in English: "${signName}".`;

    const response = await axios.post(
      `${openAIEndpoint}/openai/deployments/gpt-4o-mini-signscanner/chat/completions?api-version=2025-01-01-preview`,
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
