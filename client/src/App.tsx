import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landingPage";
import ResultPage from "./pages/resultPage";
import CameraPage from "./pages/cameraPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/camera" element={<CameraPage />} />
      </Routes>
    </Router>
  );
}

export default App;
