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

    console.log("File selected:", file.name, file.type, file.size);

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      console.log("Base64 image created, length:", base64Image.length);

      try {
        console.log("Sending request to backend...");
        console.log(
          "Backend URL: https://traffic-sign-scanner-server.vercel.app/api/predict"
        );

        // Test connection first
        const testResponse = await fetch(
          "https://traffic-sign-scanner-server.vercel.app/api/predict",
          {
            method: "OPTIONS",
          }
        ).catch((err) => {
          console.error("Connection test failed:", err);
          throw new Error(
            "Cannot connect to backend server. Make sure it's running on port 5000."
          );
        });

        const response = await axios.post(
          "https://traffic-sign-scanner-server.vercel.app/api/predict",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            timeout: 30000, // 30 second timeout
          }
        );

        console.log("Response received:", response.data);
        console.log("Response status:", response.status);

        if (response.data && response.data.prediction) {
          navigate("/result", {
            state: {
              prediction: response.data.prediction,
              image: base64Image,
            },
          });
        } else {
          throw new Error("Invalid response format from server");
        }
      } catch (error: any) {
        console.error("=== DETAILED ERROR INFORMATION ===");
        console.error("Full error object:", error);

        let errorMessage = "Failed to get prediction.";

        if (axios.isAxiosError(error)) {
          console.error("This is an Axios error");

          if (error.response) {
            // Server responded with error status
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
            console.error("Response headers:", error.response.headers);
            errorMessage = `Server error (${error.response.status}): ${
              error.response.data?.message || error.response.statusText
            }`;
          } else if (error.request) {
            // Request was made but no response received
            console.error(
              "No response received. Request details:",
              error.request
            );
            console.error("Network Error - Check if backend is running");
            errorMessage =
              "Network error: Cannot connect to server. Please check if the backend is running on port 5000.";
          } else {
            // Something else happened
            console.error("Request setup error:", error.message);
            errorMessage = `Request error: ${error.message}`;
          }

          if (error.code) {
            console.error("Error code:", error.code);
            if (error.code === "ECONNREFUSED") {
              errorMessage =
                "Connection refused: Backend server is not running on port 5000.";
            } else if (error.code === "TIMEOUT") {
              errorMessage =
                "Request timeout: Server took too long to respond.";
            }
          }
        } else {
          console.error("Non-Axios error:", error.message);
          errorMessage = error.message || errorMessage;
        }

        console.error("=== END ERROR DETAILS ===");
        alert(errorMessage);
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      console.error("FileReader error");
      alert("Failed to read the selected file.");
      setIsUploading(false);
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
