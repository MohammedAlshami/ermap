#!/usr/bin/env python3
"""
Create minimal ONNX segmentation models for testing the backend (no TensorFlow).
Input: (1, 3, 256, 256) float32, Output: (1, 1, 256, 256) float32.
Run: pip install onnx && python create_minimal_onnx.py
"""
import os
import onnx
from onnx import helper, TensorProto

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

BATCH, CHANNELS, H, W = 1, 3, 256, 256


def make_segmentation_onnx(output_path: str):
    # Input: (1, 3, 256, 256)
    input_info = helper.make_tensor_value_info(
        "input", TensorProto.FLOAT, [BATCH, CHANNELS, H, W]
    )
    # Output: (1, 1, 256, 256) - reduce mean over channels then unsqueeze
    output_info = helper.make_tensor_value_info(
        "output", TensorProto.FLOAT, [BATCH, 1, H, W]
    )
    # ReduceMean on axis=1 (channels): (1,3,256,256) -> (1,256,256)
    reduce_node = helper.make_node(
        "ReduceMean",
        inputs=["input"],
        outputs=["reduced"],
        axes=[1],
        keepdims=0,
    )
    # Unsqueeze axis=1: (1,256,256) -> (1,1,256,256). Opset 13+ uses axes as input.
    axes_initializer = helper.make_tensor(
        "axes_unsqueeze", TensorProto.INT64, [1], [1]
    )
    unsqueeze_node = helper.make_node(
        "Unsqueeze",
        inputs=["reduced", "axes_unsqueeze"],
        outputs=["output"],
    )
    graph = helper.make_graph(
        [reduce_node, unsqueeze_node],
        "minimal_seg",
        [input_info],
        [output_info],
        initializer=[axes_initializer],
    )
    model = helper.make_model(graph, producer_name="ermap-test")
    model.opset_import[0].version = 14
    onnx.checker.check_model(model)
    with open(output_path, "wb") as f:
        f.write(model.SerializeToString())
    print("Wrote", output_path)


def main():
    make_segmentation_onnx(os.path.join(MODELS_DIR, "building_segmentation.onnx"))
    make_segmentation_onnx(os.path.join(MODELS_DIR, "tree_segmentation.onnx"))
    print("Done. Backend can now be tested (output will be a dummy mask).")


if __name__ == "__main__":
    main()
