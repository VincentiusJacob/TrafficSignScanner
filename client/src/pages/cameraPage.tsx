import React from "react";
import WebcamCapture from "../components/WebcamCapture";
import { useNavigate } from "react-router-dom";
import "./cameraPage.css";

const CameraPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="camera-page"
      style={{ textAlign: "center", padding: "20px" }}
    >
      <WebcamCapture />
      <button className="close-btn" onClick={() => navigate("/")}>
        Back to Home
      </button>
    </div>
  );
};

export default CameraPage;
