import Share from "../assets/share.png";
import "./resultPage.css";

const resultPage: React.FC = () => {
  return (
    <div className="result-page">
      <div className="result-page-content">
        <h2> RESULT </h2>
        <img src="" alt="result image" />
        <div className="result-page-details">
          <h3> Traffic Sign Name </h3>
          <p> Description of the traffic sign </p>
          <div className="result-page-options">
            <button> TRY AGAIN </button>
            <img src={Share} alt="share result" style={{ width: "30px" }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default resultPage;
