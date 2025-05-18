import axios from "axios";
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import "./WebcamCapture.css";

const WebcamCapture: React.FC = () => {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [result, setResult] = useState<string | null>(null);
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
          "http://localhost:5500/predict",
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
    <div style={{ textAlign: "center" }}>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={640}
        height={480}
      />
      <br />
      <button className="predict-btn" onClick={captureAndSend}>
        Capture & Predict
      </button>
      {loading && <p>Loading...</p>}
      {result && <p>Prediction: {result}</p>}
    </div>
  );
};

export default WebcamCapture;
