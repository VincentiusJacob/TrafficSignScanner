"use client";

import type React from "react";

import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Share2, RefreshCw, AlertTriangle, Info } from "lucide-react";
import "./resultPage.css";
import axios from "axios";

const labelMap: Record<string, string> = {
  0: "Bicycles crossing",
  1: "Children crossing",
  2: "Danger Ahead",
  3: "Dangerous curve to the left",
  4: "Dangerous curve to the right",
  5: "Dont Go Left",
  6: "Dont Go Left or Right",
  7: "Dont Go Right",
  8: "Dont Go straight",
  9: "Dont Go straight or left",
  10: "Dont overtake from Left",
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
  22: "No Uturn",
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
  37: "Unknown1",
  38: "Unknown2",
  39: "Unknown3",
  40: "Unknown4",
  41: "Unknown5",
  42: "Unknown6",
  43: "Unknown7",
  44: "Unknown8",
  45: "Uturn",
  46: "Zebra Crossing",
  47: "ZigZag Curve",
  48: "keep Left",
  49: "keep Right",
  50: "speed limit (80km/h)",
  51: "watch out for cars",
};

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as {
    state: { prediction: string; image: string };
  };

  const signName = labelMap[state.prediction] || "Unknown Sign";
  const [description, setDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    };

    fetchDescription();
  }, [signName]);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Traffic Sign: ${signName}`,
          text: `I identified a ${signName} traffic sign!`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing", error));
    } else {
      alert("Web Share API not supported in your browser");
    }
  };

  return (
    <div className="result-page">
      <div className="result-container">
        <div className="result-header">
          <h1>Traffic Sign Recognition</h1>
          <div className="result-badge">Result</div>
        </div>

        <div className="result-content">
          <div className="image-container">
            <img
              src={state.image || "/placeholder.svg"}
              alt="Uploaded Traffic Sign"
              className="result-image"
            />
            <div className="image-overlay">
              <AlertTriangle className="overlay-icon" />
            </div>
          </div>

          <div className="result-details">
            <h2 className="sign-name">{signName}</h2>

            <div className="description-container">
              <div className="description-header">
                <Info size={20} />
                <h3>Description</h3>
              </div>

              <div className="description-content">
                {isLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <p>{description || "No description available"}</p>
                )}
              </div>
            </div>

            <div className="action-buttons">
              <button className="try-again-btn" onClick={() => navigate("/")}>
                <RefreshCw size={18} />
                <span>Try Again</span>
              </button>

              <button className="share-btn" onClick={handleShare}>
                <Share2 size={18} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
