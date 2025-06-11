export const labelMap: Record<number, string> = {
  0: "Bicycles crossing",
  1: "Children crossing",
  2: "Danger Ahead",
  3: "Speed limit (20km/h)",
  4: "Speed limit (30km/h)",
  5: "Speed limit (50km/h)",
  6: "Speed limit (60km/h)",
  7: "Speed limit (70km/h)",
  8: "Speed limit (80km/h)",
  9: "End of speed limit (80km/h)",
  10: "Speed limit (100km/h)",
  11: "Speed limit (120km/h)",
  12: "No passing",
  13: "No passing for vehicles over 3.5 metric tons",
  14: "Right-of-way at the next intersection",
  15: "Priority road",
  16: "Yield",
  17: "Stop",
  18: "No vehicles",
  19: "Vehicles over 3.5 metric tons prohibited",
  20: "No entry",
  21: "General caution",
  22: "Dangerous curve to the left",
  23: "Dangerous curve to the right",
  24: "Double curve",
  25: "Bumpy road",
  26: "Slippery road",
  27: "Road narrows on the right",
  28: "Road work",
  29: "Traffic signals",
  30: "Pedestrians",
  31: "Beware of ice/snow",
  32: "Wild animals crossing",
  33: "End of all speed and passing limits",
  34: "Turn right ahead",
  35: "Turn left ahead",
  36: "Ahead only",
  37: "Go straight or right",
  38: "Go straight or left",
  39: "Keep right",
  40: "Keep left",
  41: "Roundabout mandatory",
  42: "End of no passing",
  43: "End of no passing by vehicles over 3.5 metric tons",
  51: "Watch out for cars",
};

// Real prediction function that calls your Python model via API
export async function predictTrafficSign(imageFile: File): Promise<{
  classId: number;
  className: string;
  confidence: number;
}> {
  console.log("🔄 Starting API prediction...");

  try {
    // Create form data to send the image
    const formData = new FormData();
    formData.append("image", imageFile);

    // Call your prediction API endpoint
    const response = await fetch(
      "https://traffic-sign-scanner-server.vercel.app//api/predict",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ API Error:", errorData);
      throw new Error(errorData.error || "Failed to predict traffic sign");
    }

    const result = await response.json();
    console.log("✅ API prediction result:", result);

    // Extract prediction data
    const classId = Number.parseInt(result.prediction);
    const className = labelMap[classId] || "Unknown Sign";
    const confidence = result.confidence || 0.5;

    return {
      classId,
      className,
      confidence,
    };
  } catch (error) {
    console.error("❌ Prediction error:", error);
    // Return a fallback for error cases
    return {
      classId: 37, // Unknown sign type
      className: "Unknown Sign Type 1",
      confidence: 0.3,
    };
  }
}

// Real description function that calls your Azure OpenAI model
export async function getSignDescription(signName: string): Promise<string> {
  console.log("📝 Getting description from Azure for:", signName);

  try {
    // Skip API call for unknown signs
    if (signName.toLowerCase().includes("unknown")) {
      return "This traffic sign could not be identified. Please try uploading a clearer image or a different angle.";
    }

    // Call your description API endpoint
    const response = await fetch(
      "https://traffic-sign-scanner-server.vercel.app/api/get-sign-description",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signName }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch sign description");
    }

    const data = await response.json();
    return data.description;
  } catch (error) {
    console.error("❌ Description error:", error);
    return "Unable to fetch description at this time. This sign typically provides important traffic information for drivers.";
  }
}
