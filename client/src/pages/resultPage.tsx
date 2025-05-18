import { useLocation, useNavigate } from "react-router-dom";
import Share from "../assets/share.png";
import "./resultPage.css";

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

  return (
    <div className="result-page">
      <div className="result-page-content">
        <h2> RESULT </h2>
        <img
          src={state.image}
          alt="Uploaded Traffic Sign"
          style={{ width: "300px" }}
        />
        <div className="result-page-details">
          <h3>{signName}</h3>
          <p>Model Output: {state.prediction}</p>
          <div className="result-page-options">
            <button onClick={() => navigate("/")}>TRY AGAIN</button>
            <img src={Share} alt="share result" style={{ width: "30px" }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
