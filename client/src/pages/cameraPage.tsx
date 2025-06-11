"use client";

import type React from "react";
import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, RotateCcw, X, Zap } from "lucide-react";
import axios from "axios";

const CameraPage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
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
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

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

      // Create form data for API
      const formData = new FormData();
      formData.append("image", file);

      // Call your existing API
      const response = await axios.post(
        "https://traffic-sign-scanner-server.vercel.app/api/predict",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        }
      );

      console.log("✅ API prediction response:", response.data);

      if (!response.data || !response.data.prediction) {
        throw new Error("Invalid response from prediction API");
      }

      console.log("✅ Prediction complete, navigating to results...");
      navigate("/result", {
        state: {
          prediction: response.data.prediction,
          image: capturedImage,
        },
      });
    } catch (error: any) {
      console.error("=== ANALYSIS ERROR ===");
      console.error("Error:", error);

      let errorMessage = "Failed to analyze the image. Please try again.";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = `Server error (${error.response.status}): ${
            error.response.data?.error || error.response.statusText
          }`;
        } else if (error.request) {
          errorMessage =
            "Network error: Cannot connect to server. Please check your internet connection.";
        } else {
          errorMessage = `Request error: ${error.message}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, navigate]);

  const goBack = useCallback(() => {
    stopCamera();
    navigate("/");
  }, [navigate, stopCamera]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800">
        <button
          onClick={goBack}
          className="text-white hover:text-gray-300 transition-colors"
        >
          <X size={24} />
        </button>
        <h1 className="text-white text-lg font-semibold">Camera</h1>
        <div className="w-6" /> {/* Spacer */}
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }} // Mirror effect
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Camera Controls */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8">
              {!isStreaming ? (
                <button
                  onClick={startCamera}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full transition-colors"
                >
                  <Camera size={32} />
                </button>
              ) : (
                <button
                  onClick={capturePhoto}
                  className="bg-white hover:bg-gray-100 text-gray-900 p-6 rounded-full transition-colors shadow-lg"
                >
                  <div className="w-8 h-8 bg-gray-900 rounded-full" />
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <img
              src={capturedImage || "/placeholder.svg"}
              alt="Captured"
              className="w-full h-full object-cover"
            />

            {/* Photo Controls */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4">
              <button
                onClick={retakePhoto}
                disabled={isProcessing}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-full flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={20} />
                <span>Retake</span>
              </button>

              <button
                onClick={analyzePhoto}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Zap size={20} />
                <span>{isProcessing ? "Analyzing..." : "Analyze"}</span>
              </button>
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-600 text-white p-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-700">Analyzing image...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraPage;
