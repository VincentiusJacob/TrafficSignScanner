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

let model: tf.LayersModel | null = null;

export async function loadModel(): Promise<tf.LayersModel> {
  if (model) {
    return model;
  }

  try {
    console.log("🤖 Loading TensorFlow.js model...");
    model = await tf.loadLayersModel("/model/model.json");
    console.log("✅ Model loaded successfully!");
    console.log("📊 Model input shape:", model.inputs[0].shape);
    console.log("📊 Model output shape:", model.outputs[0].shape);
    return model;
  } catch (error) {
    console.error("❌ Error loading model:", error);
    throw new Error(
      "Failed to load the AI model. Please refresh the page and try again."
    );
  }
}

export function preprocessImage(imageElement: HTMLImageElement): tf.Tensor {
  console.log("🖼️ Preprocessing image...");

  // Convert image to tensor and preprocess
  const tensor = tf.browser
    .fromPixels(imageElement)
    .resizeNearestNeighbor([64, 64]) // Resize to 64x64
    .mean(2) // Convert to grayscale by averaging RGB channels
    .expandDims(2) // Add channel dimension
    .expandDims(0) // Add batch dimension
    .toFloat()
    .div(255.0); // Normalize to 0-1

  console.log("📊 Preprocessed tensor shape:", tensor.shape);
  return tensor;
}

export async function predictTrafficSign(
  imageElement: HTMLImageElement
): Promise<{
  classId: number;
  className: string;
  confidence: number;
  allPredictions: number[];
}> {
  try {
    console.log("🔮 Starting prediction...");

    const model = await loadModel();
    const preprocessedImage = preprocessImage(imageElement);

    console.log("🤖 Running model prediction...");
    const prediction = model.predict(preprocessedImage) as tf.Tensor;
    const predictionData = await prediction.data();

    // Get the predicted class
    const classId = prediction.argMax(1).dataSync()[0];
    const confidence = Math.max(...Array.from(predictionData));
    const className = labelMap[classId] || "Unknown Sign";

    console.log("🎯 Prediction results:");
    console.log("  Class ID:", classId);
    console.log("  Class Name:", className);
    console.log("  Confidence:", confidence.toFixed(4));

    // Get top 3 predictions for debugging
    const allPredictions = Array.from(predictionData);
    const top3 = allPredictions
      .map((prob, idx) => ({ idx, prob }))
      .sort((a, b) => b.prob - a.prob)
      .slice(0, 3);

    console.log("🔝 Top 3 predictions:");
    top3.forEach((pred, i) => {
      console.log(
        `  ${i + 1}. ${labelMap[pred.idx] || "Unknown"}: ${pred.prob.toFixed(
          4
        )}`
      );
    });

    // Clean up tensors
    preprocessedImage.dispose();
    prediction.dispose();

    return {
      classId,
      className,
      confidence,
      allPredictions,
    };
  } catch (error) {
    console.error("❌ Prediction error:", error);
    throw new Error("Failed to predict traffic sign. Please try again.");
  }
}

export function createImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Important for canvas operations

    img.onload = () => {
      console.log("✅ Image loaded:", img.width, "x", img.height);
      resolve(img);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
