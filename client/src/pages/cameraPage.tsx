"use client";

import type React from "react";
import WebcamCapture from "../components/WebcamCapture";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Scan } from "lucide-react";
import "./cameraPage.css";

const CameraPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="camera-page">
      <div className="camera-container">
        <div className="camera-header">
          <button className="back-button" onClick={() => navigate("/")}>
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          <div className="header-title">
            <Camera size={24} />
            <h1>Traffic Sign Scanner</h1>
          </div>
        </div>

        <div className="camera-content">
          <div className="scan-instructions">
            <div className="instruction-icon">
              <Scan size={32} />
            </div>
            <h2>Point your camera at a traffic sign</h2>
            <p>
              Position the traffic sign clearly within the frame for best
              results
            </p>
          </div>

          <div className="webcam-container">
            <WebcamCapture />
            <div className="scan-overlay">
              <div className="scan-frame">
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
              </div>
            </div>
          </div>

          <div className="camera-tips">
            <div className="tip-item">
              <div className="tip-number">1</div>
              <span>Ensure good lighting</span>
            </div>
            <div className="tip-item">
              <div className="tip-number">2</div>
              <span>Keep the sign centered</span>
            </div>
            <div className="tip-item">
              <div className="tip-number">3</div>
              <span>Hold camera steady</span>
            </div>
          </div>
        </div>
      </div>

      <div className="background-elements">
        <div className="floating-element element-1"></div>
        <div className="floating-element element-2"></div>
        <div className="floating-element element-3"></div>
      </div>
    </div>
  );
};

export default CameraPage;
