import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

const INPUT_SIZE = 256;
const MODEL_PATH = path.join(process.cwd(), 'models', 'tree_segmentation.onnx');

export interface DetectResult {
  mask: number[];
  width: number;
  height: number;
  overlayBase64?: string;
}

@Injectable()
export class TreeService {
  private session: ort.InferenceSession | null = null;
  private initPromise: Promise<void> | null = null;

  private async ensureSession(): Promise<ort.InferenceSession> {
    if (this.session) return this.session;
    if (this.initPromise) return this.initPromise.then(() => this.session!);
    this.initPromise = (async () => {
      if (!fs.existsSync(MODEL_PATH)) {
        throw new ServiceUnavailableException(
          `Model not found at ${MODEL_PATH}. Add tree_segmentation.onnx (see backend/models/README.md).`,
        );
      }
      this.session = await ort.InferenceSession.create(MODEL_PATH, {
        executionProviders: ['cpu'],
      });
    })();
    await this.initPromise;
    return this.session!;
  }

  private bufferToNCHW(buffer: Buffer, width: number, height: number): Float32Array {
    const size = width * height;
    const floatData = new Float32Array(1 * 3 * size);
    for (let i = 0; i < size; i++) {
      floatData[0 * size + i] = buffer[i * 3]! / 255;
      floatData[1 * size + i] = buffer[i * 3 + 1]! / 255;
      floatData[2 * size + i] = buffer[i * 3 + 2]! / 255;
    }
    return floatData;
  }

  async detectTrees(imageBuffer: Buffer): Promise<DetectResult> {
    const session = await this.ensureSession();

    const { data } = await sharp(imageBuffer)
      .resize(INPUT_SIZE, INPUT_SIZE)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const floatData = this.bufferToNCHW(data, INPUT_SIZE, INPUT_SIZE);
    const inputName = session.inputNames[0] ?? 'input';
    const tensor = new ort.Tensor('float32', floatData, [
      1,
      3,
      INPUT_SIZE,
      INPUT_SIZE,
    ]);

    const results = await session.run({ [inputName]: tensor });
    const outputName = session.outputNames[0] ?? 'output';
    const maskTensor = results[outputName] as ort.Tensor;
    const maskData = maskTensor.data as Float32Array;
    const mask = Array.from(maskData).map((v) => (v > 0.5 ? 1 : 0));

    const overlayBase64 = await this.maskToOverlayPng(mask, INPUT_SIZE, INPUT_SIZE);
    return {
      mask,
      width: INPUT_SIZE,
      height: INPUT_SIZE,
      overlayBase64,
    };
  }

  private async maskToOverlayPng(mask: number[], width: number, height: number): Promise<string> {
    const rgba = Buffer.alloc(width * height * 4);
    for (let i = 0; i < mask.length; i++) {
      const idx = i * 4;
      if (mask[i] === 1) {
        rgba[idx] = 34; // R (green)
        rgba[idx + 1] = 197; // G
        rgba[idx + 2] = 94; // B
        rgba[idx + 3] = 180; // A
      } else {
        rgba[idx] = 0;
        rgba[idx + 1] = 0;
        rgba[idx + 2] = 0;
        rgba[idx + 3] = 0;
      }
    }
    const buf = await sharp(rgba, {
      raw: { width, height, channels: 4 },
    })
      .png()
      .toBuffer();
    return buf.toString('base64');
  }
}
