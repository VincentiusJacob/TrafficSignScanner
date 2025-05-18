const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const app = express();
const PORT = 5500;

const pythonPath =
  "/Users/vincentiusjacob/Documents/SignScanner/server/venv/bin/python3";
console.log("🐍 Using Python:", pythonPath);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

// ✅ Multer config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Prediction route
app.post("/predict", upload.single("image"), (req, res) => {
  const imagePath = req.file?.path;
  if (!imagePath) {
    console.log("❌ No image uploaded");
    return res.status(400).send("No image uploaded");
  }

  const stats = fs.statSync(imagePath);
  console.log(`📏 File saved: ${imagePath} (${stats.size} bytes)`);

  const cmd = `${pythonPath} predict.py ${imagePath}`;
  console.log("📡 Running command:", cmd);

  const python = spawn(pythonPath, ["predict.py", imagePath]);

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
