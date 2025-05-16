import "./scanPage.css";
import camera from "../assets/camera.png";
import upload from "../assets/uploadimg.png";

const scanPage: React.FC = () => {
  return (
    <div className="scan-page">
      <div className="scan-page-frame"></div>
      <div className="scan-page-options">
        <button className="scan-page-scanbtn">
          <img src={camera} alt="scan sign" />
          <span> Scan a sign</span>
        </button>
        <button className="scan-page-uploadimgbtn">
          <img src={upload} alt="upload image" />
          <span> Upload an image</span>
        </button>
      </div>
    </div>
  );
};

export default scanPage;
