"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Share2,
  RefreshCw,
  AlertTriangle,
  Info,
  Camera,
  CheckCircle,
  XCircle,
  Zap,
  Eye,
  Target,
  Sparkles,
} from "lucide-react";
import { labelMap, getSignDescription } from "../utils/modelUtils";
import "./resultPage.css";

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as {
    state: {
      prediction: string;
      confidence?: number;
      image: string;
      className?: string;
    };
  };

  const [description, setDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  // Debug logging
  console.log("Raw prediction value:", state?.prediction);
  console.log("Prediction type:", typeof state?.prediction);
  console.log("Confidence:", state?.confidence);
  console.log("Class name:", state?.className);

  // Get sign name from state or labelMap
  const signName =
    state?.className ||
    labelMap[Number.parseInt(state?.prediction || "0")] ||
    "Unknown Sign";
  const isUnknown = signName.includes("Unknown") || signName === "Unknown Sign";
  const confidence = state?.confidence;

  console.log("Sign name:", signName);
  console.log("Is unknown:", isUnknown);

  useEffect(() => {
    const fetchDescription = async () => {
      setIsLoading(true);
      try {
        // Use dynamic description generation
        const dynamicDescription = await getSignDescription(signName);
        setDescription(dynamicDescription);

        // Show celebration for high confidence results
        if (!isUnknown && confidence && confidence > 0.8) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      } catch (error) {
        console.error("Error fetching description:", error);
        setDescription("Unable to fetch description at this time.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDescription();
  }, [signName, confidence, isUnknown]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Traffic Sign: ${signName}`,
          text: `I identified a ${signName} traffic sign!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          `Traffic Sign: ${signName} - ${window.location.href}`
        );
        alert("Link copied to clipboard!");
      } catch (error) {
        alert("Web Share API not supported in your browser");
      }
    }
  };

  const getConfidenceLevel = (conf: number) => {
    if (conf >= 0.8) return "high";
    if (conf >= 0.6) return "medium";
    return "low";
  };

  const getConfidenceText = (conf: number) => {
    if (conf >= 0.8) return "High Confidence";
    if (conf >= 0.6) return "Medium Confidence";
    return "Low Confidence";
  };

  const getConfidenceIcon = (conf: number) => {
    if (conf >= 0.8) return <CheckCircle className="confidence-icon" />;
    if (conf >= 0.6) return <AlertTriangle className="confidence-icon" />;
    return <XCircle className="confidence-icon" />;
  };

  if (!state) {
    return (
      <div className="no-results-container">
        <div className="no-results-card">
          <div className="no-results-icon">
            <XCircle className="icon-large" />
          </div>
          <h1 className="no-results-title">No Results Found</h1>
          <p className="no-results-text">
            Please upload an image to get a prediction.
          </p>
          <button onClick={() => navigate("/")} className="go-back-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="result-page">
      {/* Animated Background Elements */}
      <div className="background-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Celebration Effect */}
      {showCelebration && (
        <div className="celebration-container">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="main-container">
        {/* Header */}
        <div className="header-section">
          <div className="analysis-badge">
            <Sparkles className="badge-icon" />
            <span>Analysis Complete</span>
          </div>
          <h1 className="main-title">Traffic Sign Recognition</h1>
          <p className="main-subtitle">
            AI-powered traffic sign identification and explanation
          </p>
        </div>

        <div className="content-grid">
          {/* Image Section */}
          <div className="image-section">
            <div className="image-header">
              <h2 className="section-title">
                <div className="title-icon camera-icon">
                  <Camera className="icon" />
                </div>
                Analyzed Image
              </h2>
            </div>
            <div className="image-content">
              <div className="image-container">
                <img
                  src={state.image || "/placeholder.svg"}
                  alt="Analyzed Traffic Sign"
                  className="result-image"
                />
                <div className="image-badge">
                  <span
                    className={`status-badge ${
                      isUnknown ? "unidentified" : "identified"
                    }`}
                  >
                    {isUnknown ? (
                      <>
                        <XCircle className="badge-icon-small" />
                        Unidentified
                      </>
                    ) : (
                      <>
                        <CheckCircle className="badge-icon-small" />
                        Identified
                      </>
                    )}
                  </span>
                </div>
                <div className="image-overlay" />
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="results-section">
            {/* Sign Name */}
            <div className="identification-card">
              <div className="card-header">
                <div className="title-icon target-icon">
                  <Target className="icon" />
                </div>
                <h2 className="section-title">Identification Result</h2>
              </div>

              <h3 className="sign-name">{signName}</h3>

              {confidence !== undefined && (
                <div className="confidence-section">
                  <div className="confidence-header">
                    <div
                      className={`confidence-icon-container ${getConfidenceLevel(
                        confidence
                      )}`}
                    >
                      {getConfidenceIcon(confidence)}
                    </div>
                    <span className="confidence-text">
                      {getConfidenceText(confidence)}
                    </span>
                    <span className="confidence-percentage">
                      {(confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${getConfidenceLevel(
                        confidence
                      )}`}
                      style={{ width: `${confidence * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {isUnknown && (
                <div className="warning-card">
                  <div className="warning-content">
                    <AlertTriangle className="warning-icon" />
                    <div className="warning-text">
                      <h4 className="warning-title">Sign Not Recognized</h4>
                      <p className="warning-description">
                        The AI couldn't identify this traffic sign with high
                        confidence. Try uploading a clearer image or a different
                        angle.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="description-card">
              <div className="card-header">
                <div className="title-icon info-icon">
                  <Info className="icon" />
                </div>
                <h2 className="section-title">Description & Meaning</h2>
              </div>

              {isLoading ? (
                <div className="loading-section">
                  <div className="loading-header">
                    <div className="loading-spinner"></div>
                    <span className="loading-text">
                      Analyzing sign details...
                    </span>
                  </div>
                  <div className="loading-skeleton">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line skeleton-75"></div>
                    <div className="skeleton-line skeleton-50"></div>
                  </div>
                </div>
              ) : (
                <p className="description-text">
                  {description || "No description available"}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button onClick={() => navigate("/")} className="try-again-btn">
                <RefreshCw className="button-icon" />
                Try Again
              </button>

              <button onClick={handleShare} className="share-btn">
                <Share2 className="button-icon" />
                Share Result
              </button>
            </div>
          </div>
        </div>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="debug-section">
            <h2 className="debug-title">Debug Information</h2>
            <div className="debug-content">
              <p>
                <strong>Raw Prediction:</strong> {state?.prediction}
              </p>
              <p>
                <strong>Prediction Type:</strong> {typeof state?.prediction}
              </p>
              <p>
                <strong>Confidence:</strong> {confidence}
              </p>
              <p>
                <strong>Class Name:</strong> {state?.className}
              </p>
              <p>
                <strong>Sign Name:</strong> {signName}
              </p>
              <p>
                <strong>Is Unknown:</strong> {isUnknown.toString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultPage;
