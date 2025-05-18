import "./landingPage.css";
import background from "../assets/backgroundDesktop.png";
import camera from "../assets/camera.png";
import upload from "../assets/uploadimg.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useRef, useState } from "react";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageData, setImageData] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      setImageData(base64Image);

      try {
        const response = await axios.post(
          "http://localhost:5500/predict",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        navigate("/result", {
          state: {
            prediction: response.data.prediction,
            image: base64Image,
          },
        });
      } catch (error) {
        console.error("Upload prediction failed:", error);
        alert("Failed to get prediction.");
      }
    };

    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="landing-page"
      style={{
        backgroundImage: `url(${background})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="landing-page-content">
        <h1>
          Discover Traffic Signs <br />
          and Learn Their Meaning
        </h1>
        <span> Scan and identify traffic signs instantly with AI </span>

        <div className="landing-page-buttons">
          <button className="scan-btn" onClick={() => navigate("/camera")}>
            <img src={camera} alt="scan sign" />
            <span> Take a picture </span>
          </button>

          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleUpload}
          />

          <button className="uploadimg-btn" onClick={triggerUpload}>
            <img src={upload} alt="upload image" />
            <span> Upload image</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
