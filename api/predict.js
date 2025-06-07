const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const openAIEndpoint =
  "https://vince-mb63mgbe-eastus2.cognitiveservices.azure.com";
const openAIKey =
  "C57BMul7SGrqi12ymNhUyoTaYnsAuuIajmgVpfW6EA5FHmyKa11eJQQJ99BEACHYHv6XJ3w3AAAAACOGf571";
const pythonPath =
  "/Users/vincentiusjacob/Documents/SignScanner/server/venv/bin/python3";

// Multer config to handle file upload
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

module.exports = async (req, res) => {
  if (req.method === "POST") {
    // Handle file upload and prediction
    upload.single("image")(req, res, (err) => {
      if (err) {
        return res.status(400).send("Error uploading file");
      }

      const imagePath = req.file?.path;
      if (!imagePath) {
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
        return res
          .status(500)
          .json({ error: "Failed to start Python process" });
      });

      python.on("close", (code) => {
        const lines = result.trim().split("\n");
        const lastLine = lines[lines.length - 1].trim();

        if (code !== 0 || !lastLine) {
          return res
            .status(500)
            .json({ error: errorMsg || "Python exited with error" });
        }

        console.log("✅ Clean prediction result:", lastLine);
        res.json({ prediction: lastLine });
      });
    });
  } else {
    res.status(405).send({ error: "Method Not Allowed" });
  }
};
