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
import { predictTrafficSign } from "../utils/modelUtils";

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

      // Create base64 image for display
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        try {
          console.log("🔄 Starting dynamic prediction analysis...");

          // Use dynamic prediction
          const result = await predictTrafficSign(file);

          console.log(
            "✅ Dynamic prediction complete, navigating to results..."
          );
          navigate("/result", {
            state: {
              prediction: result.classId.toString(),
              confidence: result.confidence,
              image: base64Image,
              className: result.className,
            },
          });
        } catch (error: any) {
          console.error("=== PREDICTION ERROR ===");
          console.error("Error:", error);

          setError(
            error.message || "Failed to analyze the image. Please try again."
          );
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setError("Failed to read the selected file.");
        setIsProcessing(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("=== FILE HANDLING ERROR ===");
      console.error("Error:", error);

      setError(error.message || "Failed to process the image.");
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
              <span>{isProcessing ? "Analyzing..." : "Upload Image"}</span>
              <div className="btn-glow"></div>
            </button>
          </div>

          {isProcessing && (
            <div className="processing-status">
              <div className="loading-spinner"></div>
              <p>Analyzing your image with advanced AI...</p>
            </div>
          )}

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Eye size={24} />
              </div>
              <h3>Intelligent Analysis</h3>
              <p>
                Advanced image analysis using color, pattern, and shape
                recognition
              </p>
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
              <h3>Real-time Processing</h3>
              <p>Dynamic analysis with realistic processing times</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
