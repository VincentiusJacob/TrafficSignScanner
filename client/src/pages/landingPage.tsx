"use client";

import type React from "react";

import "./landingPage.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useRef, useState } from "react";
import { Camera, Upload, Zap, Shield, Eye, Sparkles } from "lucide-react";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;

      try {
        const response = await axios.post(
          "https://traffic-sign-scanner.vercel.app/predict",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        navigate("/result", {
          state: {
            prediction: response.data.prediction,
            image: base64Image,
          },
        });
      } catch (error) {
        console.error("Upload prediction failed:", error);
        alert("Failed to get prediction.");
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
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

          <div className="action-buttons">
            <button
              className="primary-btn scan-btn"
              onClick={() => navigate("/camera")}
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
            />

            <button
              className={`secondary-btn upload-btn ${
                isUploading ? "loading" : ""
              }`}
              onClick={triggerUpload}
              disabled={isUploading}
            >
              <Upload size={24} />
              <span>{isUploading ? "Uploading..." : "Upload Image"}</span>
              <div className="btn-glow"></div>
            </button>
          </div>

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
              <p>Process images in seconds with real-time analysis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
