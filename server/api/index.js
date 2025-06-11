const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const { spawn } = require("child_process");
const axios = require("axios");

const app = express();

// Enable CORS for all routes
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

const openAIEndpoint =
  "https://vince-mbmcn9kw-swedencentral.cognitiveservices.azure.com";
const openAIKey =
  "JwJT4BdMxNqsZgp8GFvbuusbUVeCsXL9Q8Xj6lI9GXENW1nEP0qbJQQJ99BFACfhMk5XJ3w3AAAAACOG05EX";

app.use(express.json());

// Improved multer configuration for Vercel
const storage = multer.memoryStorage(); // Use memory storage for serverless
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

app.post("/api/predict", upload.single("image"), async (req, res) => {
  console.log("🎯 Predict route hit - NEW REQUEST");
  console.log("📁 Current working directory:", process.cwd());
  console.log("📂 __dirname:", __dirname);
  console.log("🌍 Environment:", process.env.NODE_ENV);

  if (!req.file) {
    console.log("❌ No image uploaded");
    return res.status(400).json({ error: "No image uploaded" });
  }

  console.log(
    `📏 File received: ${req.file.originalname} (${req.file.size} bytes)`
  );
  console.log(`🎨 File type: ${req.file.mimetype}`);

  // Create temporary file path
  const tempDir = "/tmp";
  const tempFileName = `${Date.now()}_${req.file.originalname}`;
  const imagePath = path.join(tempDir, tempFileName);

  try {
    // Write buffer to temporary file
    fs.writeFileSync(imagePath, req.file.buffer);
    console.log(`💾 Temporary file created: ${imagePath}`);

    // Verify file was written
    const stats = fs.statSync(imagePath);
    console.log(`✅ File verified: ${stats.size} bytes`);

    // Check Python and script paths
    const scriptPath = path.join(__dirname, "predict.py");
    console.log(`📝 Python script path: ${scriptPath}`);
    console.log(`📋 Script exists: ${fs.existsSync(scriptPath)}`);

    // Check model path
    const modelPath = path.join(__dirname, "model", "cnn_model.keras");
    console.log(`🔍 Model path: ${modelPath}`);
    console.log(`📁 Model exists: ${fs.existsSync(modelPath)}`);

    // List files in current directory for debugging
    console.log("📂 Files in current directory:");
    try {
      const files = fs.readdirSync(__dirname);
      files.forEach((file) => {
        const filePath = path.join(__dirname, file);
        const stat = fs.statSync(filePath);
        console.log(`  ${stat.isDirectory() ? "📁" : "📄"} ${file}`);
      });
    } catch (err) {
      console.log("❌ Could not list directory contents:", err.message);
    }

    console.log("🐍 Starting Python process...");

    // Try different Python commands
    const pythonCommands = ["python3", "python", "/usr/bin/python3"];
    const pythonCmd = "python3";

    // Use spawn with better error handling
    const pythonProcess = spawn(pythonCmd, [scriptPath, imagePath], {
      cwd: __dirname,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, PYTHONPATH: __dirname },
    });

    let outputData = "";
    let errorData = "";

    // Set timeout for Python process
    const timeout = setTimeout(() => {
      console.log("⏰ Python process timeout");
      pythonProcess.kill("SIGTERM");
    }, 60000); // 60 second timeout

    pythonProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(`🐍 Python stdout: ${output}`);
      outputData += output;
    });

    pythonProcess.stderr.on("data", (error) => {
      const errorOutput = error.toString();
      console.error(`🔥 Python stderr: ${errorOutput}`);
      errorData += errorOutput;
    });

    pythonProcess.on("close", (code) => {
      clearTimeout(timeout);
      console.log(`🐍 Python process closed with code: ${code}`);
      console.log(`📝 Full output data: "${outputData}"`);

      // Clean up temporary file
      try {
        fs.unlinkSync(imagePath);
        console.log("🗑️ Temporary file cleaned up");
      } catch (cleanupErr) {
        console.log("⚠️ Could not clean up temp file:", cleanupErr.message);
      }

      if (code !== 0) {
        console.log(`❌ Python script failed with code ${code}`);
        console.log(`Error output: ${errorData}`);
        return res.status(500).json({
          error: "Python script failed",
          details: errorData,
          code: code,
          outputData: outputData,
        });
      }

      try {
        // Parse JSON result from Python output
        const resultMatch = outputData.match(
          /RESULT_START\s*\n(.*?)\nRESULT_END/s
        );

        if (resultMatch) {
          const resultJson = JSON.parse(resultMatch[1]);
          console.log(`🎯 Parsed prediction result:`, resultJson);

          res.json({
            prediction: resultJson.predicted_class.toString(),
            confidence: resultJson.confidence,
            fileSize: req.file.size,
            rawOutput: outputData,
          });
        } else {
          // Fallback to old parsing method
          const lines = outputData.trim().split("\n");
          const finalResult = lines[lines.length - 1];
          console.log(`🎯 Fallback prediction result: "${finalResult}"`);

          res.json({
            prediction: finalResult.trim(),
            fileSize: req.file.size,
            rawOutput: outputData,
            allLines: lines,
          });
        }
      } catch (parseError) {
        console.error("❌ Error parsing Python output:", parseError);
        res.status(500).json({
          error: "Failed to parse prediction result",
          details: parseError.message,
          rawOutput: outputData,
        });
      }
    });

    pythonProcess.on("error", (err) => {
      clearTimeout(timeout);
      console.error(`🔥 Failed to start Python process: ${err}`);

      // Clean up temporary file
      try {
        fs.unlinkSync(imagePath);
      } catch (cleanupErr) {
        console.log("⚠️ Could not clean up temp file:", cleanupErr.message);
      }

      res.status(500).json({
        error: "Failed to start Python process",
        details: err.message,
      });
    });
  } catch (fileError) {
    console.error("❌ Error handling file:", fileError);
    res.status(500).json({
      error: "File handling error",
      details: fileError.message,
    });
  }
});

app.post("/api/get-sign-description", async (req, res) => {
  try {
    console.log("📝 Description route hit");
    const { signName } = req.body;

    if (!signName) {
      return res.status(400).json({ error: "No sign name provided" });
    }

    // Skip description for unknown signs
    if (signName.toLowerCase().includes("unknown")) {
      return res.json({
        description:
          "This traffic sign could not be identified. Please try uploading a clearer image or a different angle.",
      });
    }

    const prompt = `Describe the following traffic sign in English: "${signName}". Provide a brief, clear explanation of what this sign means and what drivers should do when they see it.`;

    const response = await axios.post(
      `${openAIEndpoint}/openai/deployments/gpt-4o-mini-signscanner/chat/completions?api-version=2025-01-01-preview`,
      {
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that explains traffic signs clearly and concisely.",
          },
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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Export untuk Vercel
module.exports = app;
