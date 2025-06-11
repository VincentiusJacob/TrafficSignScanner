"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Share2, RefreshCw, AlertTriangle, Info, Camera } from "lucide-react";
import axios from "axios";

const labelMap: Record<string, string> = {
  0: "Bicycles crossing",
  1: "Children crossing",
  2: "Danger Ahead",
  3: "Dangerous curve to the left",
  4: "Dangerous curve to the right",
  5: "Don't Go Left",
  6: "Don't Go Left or Right",
  7: "Don't Go Right",
  8: "Don't Go straight",
  9: "Don't Go straight or left",
  10: "Don't overtake from Left",
  11: "Fences",
  12: "Go Left",
  13: "Go Left or right",
  14: "Go Right",
  15: "Go left or straight",
  16: "Go right or straight",
  17: "Go straight",
  18: "Go straight or right",
  19: "Heavy Vehicle Accidents",
  20: "Horn",
  21: "No Car",
  22: "No U-turn",
  23: "No entry",
  24: "No horn",
  25: "No stopping",
  26: "Road Divider",
  27: "Roundabout mandatory",
  28: "Speed limit (15km/h)",
  29: "Speed limit (30km/h)",
  30: "Speed limit (40km/h)",
  31: "Speed limit (50km/h)",
  32: "Speed limit (5km/h)",
  33: "Speed limit (60km/h)",
  34: "Speed limit (70km/h)",
  35: "Train Crossing",
  36: "Under Construction",
  37: "Unknown Sign Type 1",
  38: "Unknown Sign Type 2",
  39: "Unknown Sign Type 3",
  40: "Unknown Sign Type 4",
  41: "Unknown Sign Type 5",
  42: "Unknown Sign Type 6",
  43: "Unknown Sign Type 7",
  44: "Unknown Sign Type 8",
  45: "U-turn",
  46: "Zebra Crossing",
  47: "ZigZag Curve",
  48: "Keep Left",
  49: "Keep Right",
  50: "Speed limit (80km/h)",
  51: "Watch out for cars",
};

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as {
    state: { prediction: string; confidence?: number; image: string };
  };

  const [description, setDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debug logging
  console.log("Raw prediction value:", state?.prediction);
  console.log("Prediction type:", typeof state?.prediction);
  console.log("Confidence:", state?.confidence);
  console.log("Available label keys:", Object.keys(labelMap));

  // Convert prediction to string and get sign name
  const predictionKey = String(state?.prediction || "");
  const signName = labelMap[predictionKey] || "Unknown Sign";
  const isUnknown = signName.includes("Unknown") || signName === "Unknown Sign";
  const confidence = state?.confidence;

  console.log("Prediction key:", predictionKey);
  console.log("Sign name:", signName);
  console.log("Is unknown:", isUnknown);

  useEffect(() => {
    const fetchDescription = async () => {
      setIsLoading(true);
      try {
        const response = await axios.post(
          "https://traffic-sign-scanner-server.vercel.app/api/get-sign-description",
          {
            signName: signName,
          }
        );
        setDescription(response.data.description);
      } catch (error) {
        console.error("Error fetching description:", error);
        setDescription("Unable to fetch description at this time.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDescription();
  }, [signName]);

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
      // Fallback for browsers that don't support Web Share API
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

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return "bg-green-500";
    if (conf >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceText = (conf: number) => {
    if (conf >= 0.8) return "High Confidence";
    if (conf >= 0.6) return "Medium Confidence";
    return "Low Confidence";
  };

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Results</h1>
          <p className="text-gray-600 mb-4">
            Please upload an image to get a prediction.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Analysis Complete
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Traffic Sign Recognition
          </h1>
          <p className="text-gray-600">
            AI-powered traffic sign identification and explanation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Uploaded Image
              </h2>
            </div>
            <div className="p-6">
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={state.image || "/placeholder.svg"}
                  alt="Uploaded Traffic Sign"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isUnknown
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {isUnknown ? "Unidentified" : "Identified"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Sign Name */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" />
                Identification Result
              </h2>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {signName}
              </h3>

              {confidence !== undefined && (
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`w-3 h-3 rounded-full ${getConfidenceColor(
                      confidence
                    )}`}
                  />
                  <span className="text-sm text-gray-600">
                    {getConfidenceText(confidence)} (
                    {(confidence * 100).toFixed(1)}%)
                  </span>
                </div>
              )}

              {isUnknown && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">
                        Sign Not Recognized
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        The AI couldn't identify this traffic sign. Try
                        uploading a clearer image or a different angle.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Info className="w-5 h-5" />
                Description & Meaning
              </h2>

              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  {description || "No description available"}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share Result
              </button>
            </div>
          </div>
        </div>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Debug Information
            </h2>
            <div className="text-sm space-y-1 font-mono bg-gray-50 p-4 rounded">
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
                <strong>Label Map Key:</strong> {predictionKey}
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
