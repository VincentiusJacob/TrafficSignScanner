"use client";

import type React from "react";
import "./landingPage.css";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import {
  Camera,
  Upload,
  Zap,
  Shield,
  Eye,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { predictTrafficSign, createImageElement } from "../utils/modelUtils";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("File selected:", file.name, file.type, file.size);
    setError(null);
    setIsProcessing(true);

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select a valid image file.");
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(
          "Image file is too large. Please select an image smaller than 10MB."
        );
      }

      console.log("🖼️ Creating image element...");
      const imageElement = await createImageElement(file);

      console.log("🤖 Running AI prediction...");
      const result = await predictTrafficSign(imageElement);

      // Create base64 image for display
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;

        console.log("✅ Prediction complete, navigating to results...");
        navigate("/result", {
          state: {
            prediction: result.classId.toString(),
            confidence: result.confidence,
            image: base64Image,
            className: result.className,
          },
        });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("=== PREDICTION ERROR ===");
      console.error("Error:", error);

      let errorMessage = "Failed to process the image.";

      if (error.message.includes("Failed to load")) {
        errorMessage =
          "Failed to load the AI model. Please refresh the page and try again.";
      } else if (error.message.includes("Failed to predict")) {
        errorMessage =
          "Failed to analyze the image. Please try with a different image.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerUpload = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="landing-page">
      <div className="background-elements">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="landing-container">
        <div className="hero-section">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>AI-Powered Recognition</span>
          </div>

          <h1 className="hero-title">
            Discover Traffic Signs
            <br />
            <span className="gradient-text">Learn Their Meaning</span>
          </h1>

          <p className="hero-subtitle">
            Scan and identify traffic signs instantly with advanced AI
            technology.
            <br />
            Stay safe on the road with instant sign recognition and detailed
            explanations.
          </p>

          {error && (
            <div className="error-message">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="action-buttons">
            <button
              className="primary-btn scan-btn"
              onClick={() => navigate("/camera")}
              disabled={isProcessing}
            >
              <Camera size={24} />
              <span>Take a Picture</span>
              <div className="btn-glow"></div>
            </button>

            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleUpload}
              disabled={isProcessing}
            />

            <button
              className={`secondary-btn upload-btn ${
                isProcessing ? "loading" : ""
              }`}
              onClick={triggerUpload}
              disabled={isProcessing}
            >
              <Upload size={24} />
              <span>{isProcessing ? "Processing..." : "Upload Image"}</span>
              <div className="btn-glow"></div>
            </button>
          </div>

          {isProcessing && (
            <div className="processing-status">
              <div className="loading-spinner"></div>
              <p>Analyzing your image with AI...</p>
            </div>
          )}

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Eye size={24} />
              </div>
              <h3>Instant Recognition</h3>
              <p>Get immediate results with our advanced AI model</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={24} />
              </div>
              <h3>Road Safety</h3>
              <p>Learn traffic rules and stay safe on the road</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Zap size={24} />
              </div>
              <h3>Lightning Fast</h3>
              <p>Process images instantly in your browser</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
