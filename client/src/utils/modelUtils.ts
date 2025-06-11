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

    // Try to load the model directly first
    try {
      model = await tf.loadLayersModel("/model/model.json");
      console.log("✅ Model loaded successfully!");
      console.log("📊 Model input shape:", model.inputs[0].shape);
      console.log("📊 Model output shape:", model.outputs[0].shape);
      return model;
    } catch (initialError) {
      console.warn(
        "⚠️ Initial model loading failed, trying alternative approach:",
        initialError
      );

      // If direct loading fails, try to load and fix the model
      const modelJSON = await fetch("/model/model.json").then((response) =>
        response.json()
      );

      // Check if the model has proper input shape defined
      if (
        !modelJSON.userDefinedMetadata ||
        !modelJSON.userDefinedMetadata.inputShape
      ) {
        console.log("⚠️ Model missing input shape, adding it manually");

        // Add input shape to the model JSON
        if (!modelJSON.userDefinedMetadata) {
          modelJSON.userDefinedMetadata = {};
        }

        modelJSON.userDefinedMetadata.inputShape = [64, 64, 1];

        // Fix the first layer if needed
        if (
          modelJSON.modelTopology &&
          modelJSON.modelTopology.model_config &&
          modelJSON.modelTopology.model_config.config &&
          modelJSON.modelTopology.model_config.config.layers &&
          modelJSON.modelTopology.model_config.config.layers.length > 0
        ) {
          const firstLayer =
            modelJSON.modelTopology.model_config.config.layers[0];
          if (
            firstLayer.class_name === "InputLayer" &&
            (!firstLayer.config.batch_input_shape ||
              firstLayer.config.batch_input_shape.length === 0)
          ) {
            console.log("⚠️ Fixing input layer batch_input_shape");
            firstLayer.config.batch_input_shape = [null, 64, 64, 1];
          }
        }

        // Load weight data from both shards
        const weightData1 = await fetch("/model/group1-shard1of2.bin").then(
          (response) => response.arrayBuffer()
        );
        const weightData2 = await fetch("/model/group1-shard2of2.bin").then(
          (response) => response.arrayBuffer()
        );

        // Combine weight data
        const combinedWeightData = new Uint8Array(
          weightData1.byteLength + weightData2.byteLength
        );
        combinedWeightData.set(new Uint8Array(weightData1), 0);
        combinedWeightData.set(
          new Uint8Array(weightData2),
          weightData1.byteLength
        );

        // Load the fixed model
        const modelArtifacts = {
          modelTopology: modelJSON.modelTopology,
          weightSpecs: modelJSON.weightSpecs,
          weightData: combinedWeightData.buffer,
          userDefinedMetadata: modelJSON.userDefinedMetadata,
        };

        const loadedModel = await tf.loadLayersModel(
          tf.io.fromMemory(modelArtifacts)
        );
        model = loadedModel;

        console.log("✅ Model loaded successfully with fixes!");
        console.log("📊 Model input shape:", model.inputs[0].shape);
        console.log("📊 Model output shape:", model.outputs[0].shape);
        return model;
      } else {
        throw initialError;
      }
    }
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
  const tensor = tf.tidy(() => {
    // Read the image
    const imageTensor = tf.browser.fromPixels(imageElement);
    console.log("📊 Original image tensor shape:", imageTensor.shape);

    // Resize to 64x64
    const resized = tf.image.resizeBilinear(imageTensor, [64, 64]);
    console.log("📊 Resized tensor shape:", resized.shape);

    // Convert to grayscale by averaging RGB channels
    const grayscale = resized.mean(2, true);
    console.log("📊 Grayscale tensor shape:", grayscale.shape);

    // Normalize to 0-1
    const normalized = grayscale.div(255.0);
    console.log("📊 Normalized tensor shape:", normalized.shape);

    // Add batch dimension
    const batched = normalized.expandDims(0);
    console.log("📊 Final tensor shape:", batched.shape);

    return batched;
  });

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

    const loadedModel = await loadModel();
    const preprocessedImage = preprocessImage(imageElement);

    console.log("🤖 Running model prediction...");
    const prediction = loadedModel.predict(preprocessedImage) as tf.Tensor;
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
    tf.dispose([preprocessedImage, prediction]);

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
