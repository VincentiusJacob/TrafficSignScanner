import "./landingPage.css";
import background from "../assets/backgroundDesktop.png";
import camera from "../assets/camera.png";
import upload from "../assets/uploadimg.png";

const landingPage: React.FC = () => {
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
          {" "}
          Discover Traffic Signs <br />
          and Learn Their Meaning{" "}
        </h1>
        <span> Scan and identify traffic signs instantly with AI </span>
        <div className="landing-page-buttons">
          <button className="scan-btn">
            <img src={camera} alt="scan sign" />
            <span> Take a picture </span>
          </button>
          <button className="uploadimg-btn">
            <img src={upload} alt="upload image" />
            <span> Upload image</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default landingPage;
