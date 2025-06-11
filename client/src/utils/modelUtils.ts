export const labelMap: Record<number, string> = {
  0: "Bicycles crossing",
  1: "Children crossing",
  2: "Danger Ahead",
  3: "Dangerous curve to the left",
  4: "Dangerous curve to the right",
  5: "Don't Go Left",
  6: "Don't Go Left or Right",
  7: "Don't Go Right",
  8: "Don't Go straight",
  9: "Don't Go straight or left",
  10: "Don't overtake from Left",
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
  22: "No U-turn",
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
  37: "Unknown Sign Type 1",
  38: "Unknown Sign Type 2",
  39: "Unknown Sign Type 3",
  40: "Unknown Sign Type 4",
  41: "Unknown Sign Type 5",
  42: "Unknown Sign Type 6",
  43: "Unknown Sign Type 7",
  44: "Unknown Sign Type 8",
  45: "U-turn",
  46: "Zebra Crossing",
  47: "ZigZag Curve",
  48: "Keep Left",
  49: "Keep Right",
  50: "Speed limit (80km/h)",
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
