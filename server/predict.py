import sys
import os
import traceback
import tensorflow as tf
import numpy as np
from PIL import Image
import json

print("🚀 Python script started")
print(f"📝 Arguments received: {sys.argv}")

try:
    # Print working directory and environment info
    print(f"📂 Current working directory: {os.getcwd()}")
    print(f"🐍 Python version: {sys.version}")
    print(f"🔧 TensorFlow version: {tf.__version__}")
    
    # Try multiple possible model paths
    possible_paths = [
        "model/cnn_model.keras",
        "./model/cnn_model.keras",
        "/var/task/model/cnn_model.keras",
        os.path.join(os.path.dirname(__file__), "model", "cnn_model.keras")
    ]
    
    model_path = None
    for path in possible_paths:
        abs_path = os.path.abspath(path)
        print(f"🔍 Checking path: {abs_path}")
        if os.path.exists(path):
            model_path = path
            print(f"✅ Found model at: {abs_path}")
            break
        else:
            print(f"❌ Not found: {abs_path}")
    
    if not model_path:
        print("❌ Model file not found in any expected location")
        # List all files in current directory and subdirectories
        for root, dirs, files in os.walk("."):
            for file in files:
                if file.endswith(('.keras', '.h5', '.pb')):
                    print(f"📁 Found model file: {os.path.join(root, file)}")
        sys.exit(1)

    print(f"📦 Loading model from: {model_path}")
    model = tf.keras.models.load_model(model_path)
    print("✅ Model loaded successfully!")
    
    # Print model info
    print(f"📊 Model input shape: {model.input_shape}")
    print(f"📊 Model output shape: {model.output_shape}")
    print(f"📊 Number of classes: {model.output_shape[-1]}")

    def preprocess_image(image_path):
        print(f"🖼️ Preprocessing image: {image_path}")
        
        # Check if image exists
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")
        
        # Load and preprocess image
        img = Image.open(image_path)
        print(f"📏 Original image size: {img.size}")
        print(f"🎨 Original image mode: {img.mode}")
        
        # Convert to grayscale and resize
        img = img.convert("L").resize((64, 64))
        print(f"📏 Processed image size: {img.size}")
        
        # Convert to numpy array and normalize
        img_array = np.array(img, dtype=np.float32) / 255.0
        print(f"📊 Image array shape before expand: {img_array.shape}")
        print(f"📊 Image array min/max: {img_array.min():.3f}/{img_array.max():.3f}")
        
        # Add channel dimension (grayscale)
        img_array = np.expand_dims(img_array, axis=-1)
        print(f"📊 Image array shape after channel expand: {img_array.shape}")
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        print(f"📊 Final tensor shape: {img_array.shape}")
        
        return img_array

    def predict(image_path):
        print(f"🔮 Starting prediction for: {image_path}")
        
        try:
            img_tensor = preprocess_image(image_path)
            
            print("🤖 Running model prediction...")
            prediction = model.predict(img_tensor, verbose=0)
            print(f"🎯 Raw prediction shape: {prediction.shape}")
            print(f"🎯 Raw prediction: {prediction}")
            
            # Get predicted class and confidence
            predicted_class = int(np.argmax(prediction, axis=1)[0])
            confidence = float(np.max(prediction))
            
            print(f"🏆 Predicted class: {predicted_class}")
            print(f"📈 Confidence: {confidence:.4f}")
            
            # Get top 3 predictions for debugging
            top_3_indices = np.argsort(prediction[0])[-3:][::-1]
            print("🔝 Top 3 predictions:")
            for i, idx in enumerate(top_3_indices):
                print(f"  {i+1}. Class {idx}: {prediction[0][idx]:.4f}")
            
            return predicted_class, confidence
            
        except Exception as e:
            print(f"❌ Error in prediction: {str(e)}")
            traceback.print_exc()
            raise

    if __name__ == "__main__":
        if len(sys.argv) < 2:
            print("❌ No image path provided")
            sys.exit(1)
            
        img_path = sys.argv[1]
        print(f"🖼️ Processing image: {img_path}")
        
        try:
            predicted_class, confidence = predict(img_path)
            
            # Return result as JSON for better parsing
            result = {
                "predicted_class": predicted_class,
                "confidence": confidence
            }
            
            print("=" * 50)
            print("RESULT_START")
            print(json.dumps(result))
            print("RESULT_END")
            print("=" * 50)
            
        except Exception as e:
            print(f"❌ Prediction failed: {str(e)}")
            traceback.print_exc()
            sys.exit(1)

except Exception as e:
    print("🔥 Exception caught in main:")
    print(f"Error: {str(e)}")
    traceback.print_exc()
    sys.exit(1)
