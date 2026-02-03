#!/usr/bin/env python3
"""
Download building segmentation Keras model and convert to ONNX.
Follows the tutorial: Building Segmentation U-Net -> ONNX for NodeJS.
"""
import os
import sys
import urllib.request
import shutil

# Project paths: script lives in backend/scripts/, models go in backend/models/
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
MODELS_DIR = os.path.join(BACKEND_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

KERAS_URL = "https://github.com/gunaykrgl/buildingSegmentation/raw/main/building_segmentation_model.keras"
KERAS_PATH = os.path.join(MODELS_DIR, "building_segmentation_model.keras")
BUILDING_ONNX_PATH = os.path.join(MODELS_DIR, "building_segmentation.onnx")
TREE_ONNX_PATH = os.path.join(MODELS_DIR, "tree_segmentation.onnx")
INPUT_SIZE = 256


def download_building_keras():
    print("Downloading building_segmentation_model.keras ...")
    urllib.request.urlretrieve(KERAS_URL, KERAS_PATH)
    if not os.path.isfile(KERAS_PATH) or os.path.getsize(KERAS_PATH) < 1000:
        raise SystemExit("Download failed or file too small.")
    print("Downloaded to", KERAS_PATH)


def convert_building_to_onnx():
    import tensorflow as tf
    import tf2onnx

    if not os.path.isfile(KERAS_PATH):
        raise SystemExit("Missing " + KERAS_PATH + ". Run download first.")

    print("Loading Keras model ...")
    model = tf.keras.models.load_model(KERAS_PATH)
    # Use model input shape if set, else (256, 256, 3)
    try:
        in_shape = model.input_shape
        if in_shape and len(in_shape) >= 3:
            h, w = int(in_shape[1]), int(in_shape[2])
        else:
            h = w = INPUT_SIZE
    except Exception:
        h = w = INPUT_SIZE
    print("Model input shape: (1, {}, {}, 3)".format(h, w))
    input_spec = [
        tf.TensorSpec(
            (1, h, w, 3),
            tf.float32,
            name="input",
        )
    ]
    print("Converting to ONNX ...")
    onnx_model, _ = tf2onnx.convert.from_keras(
        model,
        input_signature=input_spec,
        opset=14,
    )
    tf2onnx.save_model(onnx_model, BUILDING_ONNX_PATH)
    print("Saved", BUILDING_ONNX_PATH)


def copy_building_to_tree():
    """Use building model as tree model for testing (same input/output shape)."""
    if os.path.isfile(BUILDING_ONNX_PATH):
        shutil.copy(BUILDING_ONNX_PATH, TREE_ONNX_PATH)
        print("Copied building_segmentation.onnx -> tree_segmentation.onnx (for testing)")
    else:
        print("Skip tree copy: building_segmentation.onnx not found.")


def main():
    steps = sys.argv[1:] or ["download", "convert", "tree"]
    if "download" in steps:
        download_building_keras()
    if "convert" in steps:
        convert_building_to_onnx()
    if "tree" in steps:
        copy_building_to_tree()
    print("Done.")


if __name__ == "__main__":
    main()
