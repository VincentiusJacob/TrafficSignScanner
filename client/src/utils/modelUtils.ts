import * as tf from "@tensorflow/tfjs";

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

// Global model cache
let modelCache: tf.LayersModel | null = null;
let modelLoading = false;

// Load the TensorFlow.js model
async function loadModel(): Promise<tf.LayersModel> {
  if (modelCache) {
    console.log("✅ Using cached model");
    return modelCache;
  }

  if (modelLoading) {
    console.log("⏳ Model already loading, waiting...");
    // Wait for the model to finish loading
    while (modelLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (modelCache) return modelCache;
  }

  try {
    modelLoading = true;
    console.log("🔄 Loading TensorFlow.js model...");

    // Load your converted model
    const model = await tf.loadLayersModel("/model/model.json");

    console.log("✅ Model loaded successfully!");
    console.log("📊 Model summary:");
    console.log(`  Input shape: ${JSON.stringify(model.inputs[0].shape)}`);
    console.log(`  Output shape: ${JSON.stringify(model.outputs[0].shape)}`);

    modelCache = model;
    return model;
  } catch (error) {
    console.error("❌ Failed to load model:", error);
    throw new Error("Failed to load TensorFlow.js model");
  } finally {
    modelLoading = false;
  }
}

// Preprocess image for the model
function preprocessImage(imageElement: HTMLImageElement): tf.Tensor {
  console.log("🔄 Preprocessing image...");

  return tf.tidy(() => {
    // Convert image to tensor
    let tensor = tf.browser.fromPixels(imageElement, 1); // grayscale (1 channel)

    console.log(`📏 Original image tensor shape: ${tensor.shape}`);

    // Resize to 64x64 (based on your model training)
    tensor = tf.image.resizeBilinear(tensor, [64, 64]);

    // Normalize pixel values to [0, 1]
    tensor = tensor.div(255.0);

    // Add batch dimension
    tensor = tensor.expandDims(0);

    console.log(`📏 Preprocessed tensor shape: ${tensor.shape}`);

    return tensor;
  });
}

// Real prediction using your TensorFlow.js model
export async function predictTrafficSign(imageFile: File): Promise<{
  classId: number;
  className: string;
  confidence: number;
}> {
  console.log("🚀 Starting TensorFlow.js prediction...");

  try {
    // Load the model
    const model = await loadModel();

    // Create image element
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          console.log("🖼️ Image loaded, running prediction...");

          // Preprocess the image
          const preprocessedImage = preprocessImage(img);

          // Run prediction
          console.log("🧠 Running model inference...");
          const predictions = model.predict(preprocessedImage) as tf.Tensor;

          // Get prediction results
          const predictionData = await predictions.data();
          const predictionArray = Array.from(predictionData);

          console.log(
            "📊 Raw predictions:",
            predictionArray.slice(0, 10),
            "..."
          ); // Show first 10

          // Find the class with highest probability
          const classId = predictionArray.indexOf(Math.max(...predictionArray));
          const confidence = predictionArray[classId];
          const className = labelMap[classId] || "Unknown Sign";

          console.log("🎯 Prediction results:");
          console.log(`  Class ID: ${classId}`);
          console.log(`  Class Name: ${className}`);
          console.log(
            `  Confidence: ${confidence.toFixed(4)} (${(
              confidence * 100
            ).toFixed(2)}%)`
          );

          // Clean up tensors
          preprocessedImage.dispose();
          predictions.dispose();

          resolve({
            classId,
            className,
            confidence,
          });
        } catch (error) {
          console.error("❌ Prediction error:", error);
          reject(error);
        }
      };

      img.onerror = () => {
        console.error("❌ Failed to load image");
        reject(new Error("Failed to load image"));
      };

      // Load the image
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(imageFile);
    });
  } catch (error) {
    console.error("❌ TensorFlow.js prediction failed:", error);

    // Fallback to unknown sign
    return {
      classId: 37,
      className: "Unknown Sign Type 1",
      confidence: 0.3,
    };
  }
}

// Description function - try API first, fallback to local
export async function getSignDescription(signName: string): Promise<string> {
  console.log("📝 Getting description for:", signName);

  // Skip API call for unknown signs
  if (signName.toLowerCase().includes("unknown")) {
    return "This traffic sign could not be identified with high confidence. Please try uploading a clearer image with better lighting, or capture the sign from a different angle for better recognition.";
  }

  try {
    console.log("📤 Trying Azure OpenAI API...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(
      "https://traffic-sign-scanner-server.vercel.app/api/get-sign-description",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ signName }),
        mode: "cors",
        signal: controller.signal,
      }
    ).finally(() => clearTimeout(timeoutId));

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Got description from Azure OpenAI");
      return data.description;
    } else {
      throw new Error(`API responded with status: ${response.status}`);
    }
  } catch (error) {
    console.warn("⚠️ Azure API failed, using local description:", error);
    return generateLocalDescription(signName);
  }
}

// Local description generation
function generateLocalDescription(signName: string): string {
  console.log("🔄 Generating local description...");

  const descriptions: Record<string, string[]> = {
    speed: [
      `This speed limit sign establishes the maximum permitted velocity for vehicles on this road section. Drivers must not exceed ${
        signName.match(/\d+/)?.[0] || "the specified"
      } km/h. Exceeding this limit may result in traffic violations and compromises road safety.`,
      `The ${signName} indicates the maximum speed allowed on this roadway. This limit is set based on road conditions, traffic patterns, and safety considerations. Drivers should maintain appropriate speeds below this limit based on current conditions.`,
      `This regulatory sign sets the speed limit at ${
        signName.match(/\d+/)?.[0] || "the specified"
      } kilometers per hour. Compliance with speed limits is essential for road safety and helps prevent accidents caused by excessive speed.`,
    ],
    prohibition: [
      `This prohibition sign indicates that ${signName.toLowerCase()} is not permitted in this area. Drivers must comply with this restriction to avoid traffic violations and ensure safe traffic flow.`,
      `The ${signName} sign prohibits specific actions or vehicle types from this road section. Violating prohibition signs can result in fines and may create dangerous traffic situations.`,
      `This regulatory sign clearly states that ${signName.toLowerCase()} is forbidden. Such restrictions are implemented to maintain traffic safety and proper road usage.`,
    ],
    warning: [
      `This warning sign alerts drivers to ${signName.toLowerCase()} ahead. Reduce speed and exercise increased caution when approaching and navigating through this area.`,
      `The ${signName} sign indicates potential hazards or changing road conditions. Drivers should be prepared to adjust their driving behavior and remain vigilant.`,
      `This cautionary sign warns of ${signName.toLowerCase()}. Such warnings help drivers anticipate and safely navigate potentially dangerous road conditions.`,
    ],
    mandatory: [
      `This mandatory sign requires drivers to ${signName.toLowerCase()}. Compliance with mandatory signs is legally required and essential for maintaining proper traffic flow.`,
      `The ${signName} sign indicates a compulsory action that all drivers must follow. These signs ensure orderly traffic movement and prevent conflicts between vehicles.`,
      `This regulatory sign mandates that vehicles must ${signName.toLowerCase()}. Following mandatory signs helps maintain traffic discipline and road safety.`,
    ],
    directional: [
      `This directional sign indicates that vehicles should ${signName.toLowerCase()}. Following directional guidance helps maintain proper traffic flow and prevents confusion at intersections.`,
      `The ${signName} sign provides clear direction for vehicle movement. Such signs are crucial for organizing traffic and preventing accidents at complex road junctions.`,
      `This sign directs traffic to ${signName.toLowerCase()}, helping drivers navigate safely through intersections and road networks.`,
    ],
  };

  // Determine category
  let category = "warning";
  const lowerSignName = signName.toLowerCase();

  if (lowerSignName.includes("speed") || lowerSignName.includes("km/h")) {
    category = "speed";
  } else if (lowerSignName.includes("no ") || lowerSignName.includes("don't")) {
    category = "prohibition";
  } else if (
    lowerSignName.includes("go ") ||
    lowerSignName.includes("keep") ||
    lowerSignName.includes("turn")
  ) {
    category = "directional";
  } else if (
    lowerSignName.includes("mandatory") ||
    lowerSignName.includes("roundabout")
  ) {
    category = "mandatory";
  } else if (
    lowerSignName.includes("crossing") ||
    lowerSignName.includes("danger") ||
    lowerSignName.includes("curve")
  ) {
    category = "warning";
  }

  const categoryDescriptions = descriptions[category];
  return categoryDescriptions[
    Math.floor(Math.random() * categoryDescriptions.length)
  ];
}

// Preload the model when the module loads
if (typeof window !== "undefined") {
  console.log("🚀 Preloading TensorFlow.js model...");
  loadModel().catch((error) => {
    console.warn("⚠️ Failed to preload model:", error);
  });
}
