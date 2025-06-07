"use client";

import axios from "axios";
import type React from "react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { Camera, Loader2, Zap } from "lucide-react";
import "./WebcamCapture.css";

const WebcamCapture: React.FC = () => {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [loading, setLoading] = useState(false);

  const captureAndSend = async () => {
    if (!webcamRef.current) return;

    const screenshot = webcamRef.current.getScreenshot();

    if (screenshot) {
      setLoading(true);

      try {
        const base64Data = screenshot.split(",")[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length)
          .fill(0)
          .map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/jpeg" });

        const formData = new FormData();
        formData.append("image", blob, "webcam.jpg");

        const response = await axios.post(
          "https://traffic-sign-scanner.vercel.app/predict",
          formData
        );

        navigate("/result", {
          state: {
            prediction: response.data.prediction,
            image: screenshot, // base64 image
          },
        });
      } catch (error) {
        console.error("Prediction error:", error);
        alert("Prediction failed");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="webcam-capture">
      <div className="webcam-wrapper">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={640}
          height={480}
          className="webcam-video"
        />

        {/* Scan overlay */}
        <div className="scan-overlay">
          <div className="scan-line"></div>
        </div>
      </div>

      <div className="capture-controls">
        <button
          className={`predict-btn ${loading ? "loading" : ""}`}
          onClick={captureAndSend}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="btn-icon spinning" size={20} />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Camera className="btn-icon" size={20} />
              <span>Capture & Predict</span>
              <Zap className="btn-icon-accent" size={16} />
            </>
          )}
        </button>

        {loading && (
          <div className="loading-indicator">
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
            <p className="loading-text">Processing your image...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebcamCapture;
