import sys
import numpy as np
from PIL import Image
import tensorflow as tf
import traceback

try:
    print("📦 Loading model...")
    model = tf.keras.models.load_model("model/cnn_model.keras")

    def preprocess_image(image_path):
        img = Image.open(image_path).convert("L").resize((64, 64))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=-1)  
        return np.expand_dims(img_array, axis=0)        

    def predict(image_path):
        img_tensor = preprocess_image(image_path)
        prediction = model.predict(img_tensor)
        predicted_class = np.argmax(prediction, axis=1)[0]
        return predicted_class

    if __name__ == "__main__":
        img_path = sys.argv[1]
        result = predict(img_path)
        print(result) 


except Exception:
    print("🔥 Exception caught:")
    traceback.print_exc()
    sys.exit(1)
