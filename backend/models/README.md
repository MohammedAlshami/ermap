# Segmentation models (ONNX)

Place ONNX models here for AI detection on drawn map areas.

- **building_segmentation.onnx** – building segmentation (U-Net style, input 256×256 RGB, output mask)
- **tree_segmentation.onnx** – tree segmentation (same input/output format)

## Getting models

1. **Buildings:** Use a pretrained U-Net for building segmentation (e.g. from [Building Segmentation](https://github.com/gunaykrgl/buildingSegmentation)), then convert the Keras/TF model to ONNX (e.g. with `keras2onnx` or `tf2onnx`).
2. **Trees:** Use a tree segmentation model (e.g. DeepForest or similar), export to ONNX.

## Expected format

- Input: batch of RGB images, shape `(1, 3, 256, 256)` (NCHW), float32, values 0–1.
- Output: mask tensor, shape compatible with `(1, 1, 256, 256)` or flattened; values > 0.5 treated as positive (building/tree).

If your model uses different input/output names or shapes, adjust `building.service.ts` and `tree.service.ts` accordingly.
