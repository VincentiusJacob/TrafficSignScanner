"use client";

import type React from "react";
import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  RotateCcw,
  X,
  Zap,
  Focus,
  Sparkles,
  Target,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { predictTrafficSign } from "../utils/modelUtils";
import "./cameraPage.css";

const CameraPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        "Unable to access camera. Please check permissions and try again."
      );
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setTimeout(() => {
      startCamera();
    }, 100);
  }, [stopCamera, startCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the image data
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(imageDataUrl);
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const analyzePhoto = useCallback(async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Convert base64 to blob
      const base64Response = await fetch(capturedImage);
      const blob = await base64Response.blob();

      // Create a File object from the blob
      const file = new File([blob], "camera-capture.jpg", {
        type: "image/jpeg",
      });

      console.log("🤖 Running dynamic AI analysis on captured image...");
      const result = await predictTrafficSign(file);

      console.log("✅ Analysis complete, navigating to results...");
      navigate("/result", {
        state: {
          prediction: result.classId.toString(),
          confidence: result.confidence,
          image: capturedImage,
          className: result.className,
        },
      });
    } catch (error: any) {
      console.error("=== ANALYSIS ERROR ===");
      console.error("Error:", error);

      setError(
        error.message || "Failed to analyze the image. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, navigate]);

  const goBack = useCallback(() => {
    stopCamera();
    navigate("/");
  }, [navigate, stopCamera]);

  return (
    <div className="camera-page">
      {/* Animated Background */}
      <div className="background-elements">
        <div className="floating-blob blob-1"></div>
        <div className="floating-blob blob-2"></div>
        <div className="floating-blob blob-3"></div>
      </div>

      {/* Header */}
      <div className="camera-header">
        <button onClick={goBack} className="back-button">
          <X className="button-icon" />
          <span>Back</span>
        </button>
        <div className="header-title">
          <div className="title-icon">
            <Camera className="icon" />
          </div>
          <h1>AI Traffic Scanner</h1>
        </div>
        <div className="header-spacer"></div>
      </div>

      {/* Main Content */}
      <div className="camera-content">
        {!capturedImage ? (
          <div className="camera-view">
            {/* Instructions */}
            {!isStreaming && (
              <div className="instructions-card">
                <div className="instruction-icon">
                  <Focus className="icon" />
                </div>
                <h2>Ready to Scan</h2>
                <p>
                  Point your camera at a traffic sign and capture it for AI
                  analysis
                </p>
                <div className="tips-list">
                  <div className="tip-item">
                    <CheckCircle className="tip-icon" />
                    <span>Ensure good lighting</span>
                  </div>
                  <div className="tip-item">
                    <CheckCircle className="tip-icon" />
                    <span>Keep sign centered</span>
                  </div>
                  <div className="tip-item">
                    <CheckCircle className="tip-icon" />
                    <span>Hold camera steady</span>
                  </div>
                </div>
              </div>
            )}

            {/* Camera Container */}
            <div className="camera-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              <canvas ref={canvasRef} className="hidden-canvas" />

              {/* Camera Overlay */}
              {isStreaming && (
                <div className="camera-overlay">
                  {/* Scan Frame */}
                  <div className="scan-frame">
                    <div className="corner corner-tl"></div>
                    <div className="corner corner-tr"></div>
                    <div className="corner corner-bl"></div>
                    <div className="corner corner-br"></div>
                    <div className="scan-line"></div>
                  </div>

                  {/* Camera Toggle */}
                  <button onClick={toggleCamera} className="camera-toggle">
                    <RotateCcw className="toggle-icon" />
                  </button>

                  {/* Scan Instructions */}
                  <div className="scan-instructions">
                    <Target className="scan-icon" />
                    <span>Align traffic sign within frame</span>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="camera-controls">
              {!isStreaming ? (
                <button onClick={startCamera} className="start-camera-btn">
                  <Camera className="button-icon" />
                  <span>Start Camera</span>
                  <Sparkles className="accent-icon" />
                </button>
              ) : (
                <button onClick={capturePhoto} className="capture-btn">
                  <div className="capture-inner">
                    <div className="capture-ring"></div>
                  </div>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="preview-view">
            {/* Captured Image */}
            <div className="image-preview">
              <img
                src={capturedImage || "/placeholder.svg"}
                alt="Captured"
                className="preview-image"
              />
              <div className="preview-overlay">
                <div className="preview-badge">
                  <CheckCircle className="badge-icon" />
                  <span>Image Captured</span>
                </div>
              </div>
            </div>

            {/* Preview Controls */}
            <div className="preview-controls">
              <button
                onClick={retakePhoto}
                disabled={isProcessing}
                className="retake-btn"
              >
                <RotateCcw className="button-icon" />
                <span>Retake</span>
              </button>

              <button
                onClick={analyzePhoto}
                disabled={isProcessing}
                className="analyze-btn"
              >
                <Zap className="button-icon" />
                <span>{isProcessing ? "Analyzing..." : "Analyze"}</span>
                {!isProcessing && <Sparkles className="accent-icon" />}
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertTriangle className="error-icon" />
            <p>{error}</p>
            <button onClick={() => setError(null)} className="dismiss-btn">
              <X className="dismiss-icon" />
            </button>
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="processing-overlay">
            <div className="processing-card">
              <div className="processing-animation">
                <div className="processing-ring"></div>
                <div className="processing-inner">
                  <Zap className="processing-icon" />
                </div>
              </div>
              <h3>AI Analysis in Progress</h3>
              <p>Identifying traffic sign with advanced neural networks...</p>
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraPage;
