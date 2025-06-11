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
  Sparkles,
  AlertTriangle,
  Brain,
  Rocket,
} from "lucide-react";
import { predictTrafficSign } from "../utils/modelUtils";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tambahkan state untuk menampilkan upload animation
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadAnimation, setShowUploadAnimation] = useState(false);

  // Modifikasi handleUpload function untuk menambahkan animasi upload
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("File selected:", file.name, file.type, file.size);
    setError(null);
    setIsProcessing(true);
    setShowUploadAnimation(true);
    setUploadProgress(0);

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

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);

      // Create base64 image for display
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        clearInterval(progressInterval);
        setUploadProgress(100);

        // Add a small delay to show 100% before processing
        setTimeout(async () => {
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
            setShowUploadAnimation(false);
          }
        }, 500);
      };

      reader.onerror = () => {
        clearInterval(progressInterval);
        setError("Failed to read the selected file.");
        setIsProcessing(false);
        setShowUploadAnimation(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("=== FILE HANDLING ERROR ===");
      console.error("Error:", error);

      setError(error.message || "Failed to process the image.");
      setIsProcessing(false);
      setShowUploadAnimation(false);
    }
  };

  const triggerUpload = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="landing-page">
      {/* Epic Background */}
      <div className="background-container">
        {/* Animated Grid */}
        <div className="grid-background"></div>

        {/* Floating Particles */}
        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`particle particle-${(i % 3) + 1}`}></div>
          ))}
        </div>

        {/* Neon Orbs */}
        <div className="neon-orbs">
          <div className="neon-orb orb-1"></div>
          <div className="neon-orb orb-2"></div>
          <div className="neon-orb orb-3"></div>
          <div className="neon-orb orb-4"></div>
        </div>

        {/* Geometric Shapes */}
        <div className="geometric-shapes">
          <div className="geo-shape triangle-1"></div>
          <div className="geo-shape triangle-2"></div>
          <div className="geo-shape circle-1"></div>
          <div className="geo-shape hexagon-1"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="landing-container">
        <div className="hero-section">
          {/* Epic Badge */}
          <div className="hero-badge">
            <div className="badge-glow"></div>
            <Brain className="badge-icon" />
            <span>Next-Gen AI Technology</span>
            <Sparkles className="badge-sparkle" />
          </div>

          {/* Mind-blowing Title */}
          <h1 className="hero-title">
            <span className="title-line-1">TRAFFIC SIGN</span>
            <span className="title-line-2">
              <span className="cyber-text">RECOGNITION</span>
            </span>
          </h1>

          {/* Subtitle with Glow */}
          <p className="hero-subtitle">
            Experience the future of road safety with our revolutionary
            AI-powered traffic sign recognition system.
            <br />
            <span className="subtitle-highlight">
              Instant. Accurate. Intelligent.
            </span>
          </p>

          {/* Error Message */}
          {error && (
            <div className="error-container">
              <div className="error-glow"></div>
              <AlertTriangle className="error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Epic Action Buttons */}
          <div className="action-section">
            <button
              className="mega-btn primary-mega-btn"
              onClick={() => navigate("/camera")}
              disabled={isProcessing}
            >
              <div className="btn-bg-effect"></div>
              <div className="btn-content">
                <Camera className="btn-icon" />
                <span className="btn-text">SCAN NOW</span>
                <div className="btn-pulse"></div>
              </div>
              <div className="btn-border-glow"></div>
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
              className={`mega-btn secondary-mega-btn ${
                isProcessing ? "loading" : ""
              }`}
              onClick={triggerUpload}
              disabled={isProcessing}
            >
              <div className="btn-bg-effect"></div>
              <div className="btn-content">
                <Upload className="btn-icon" />
                <span className="btn-text">
                  {isProcessing ? "ANALYZING..." : "UPLOAD"}
                </span>
                {isProcessing && <div className="btn-spinner"></div>}
              </div>
              <div className="btn-border-glow"></div>
            </button>
          </div>

          {/* Processing Status */}
          {isProcessing && !showUploadAnimation && (
            <div className="processing-container">
              <div className="processing-orb">
                <div className="orb-ring ring-1"></div>
                <div className="orb-ring ring-2"></div>
                <div className="orb-ring ring-3"></div>
                <div className="orb-core">
                  <Zap className="core-icon" />
                </div>
              </div>
              <p className="processing-text">
                <span className="text-glow">
                  AI NEURAL NETWORKS ANALYZING...
                </span>
              </p>
            </div>
          )}

          {/* Upload Animation */}
          {showUploadAnimation && (
            <div className="upload-animation-container">
              {/* Simple Circle Loading */}
              <div className="simple-circle-loader">
                <div className="circle-background"></div>
                <div className="circle-progress"></div>
                <div className="circle-percentage">
                  {Math.round(uploadProgress)}%
                </div>
              </div>

              <div className="upload-message">
                {uploadProgress < 100 ? (
                  <p>Uploading your traffic sign image...</p>
                ) : (
                  <p>Preparing for AI analysis...</p>
                )}
              </div>
            </div>
          )}

          {/* Insane Features Grid */}
          <div className="features-container">
            <div className="features-grid">
              <div className="feature-card card-1">
                <div className="card-glow"></div>
                <div className="feature-icon-container">
                  <div className="icon-bg-effect"></div>
                  <Brain className="feature-icon" />
                </div>
                <h3 className="feature-title">Neural AI</h3>
                <p className="feature-description">
                  Advanced deep learning algorithms with 99.9% accuracy
                </p>
                <div className="card-border-effect"></div>
              </div>

              <div className="feature-card card-2">
                <div className="card-glow"></div>
                <div className="feature-icon-container">
                  <div className="icon-bg-effect"></div>
                  <Rocket className="feature-icon" />
                </div>
                <h3 className="feature-title">Lightning Fast</h3>
                <p className="feature-description">
                  Real-time processing in under 0.5 seconds
                </p>
                <div className="card-border-effect"></div>
              </div>

              <div className="feature-card card-3">
                <div className="card-glow"></div>
                <div className="feature-icon-container">
                  <div className="icon-bg-effect"></div>
                  <Shield className="feature-icon" />
                </div>
                <h3 className="feature-title">Road Safety</h3>
                <p className="feature-description">
                  Comprehensive traffic sign database and safety insights
                </p>
                <div className="card-border-effect"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
