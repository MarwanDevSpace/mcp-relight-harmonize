import fs from "fs";
import path from "path";
import { PNG } from "pngjs";
import jpeg from "jpeg-js";
import { ImageProcessingError } from "../core/errors";

export interface RawImage {
  width: number;
  height: number;
  data: Buffer; // Interleaved RGBA: 4 bytes per pixel [r, g, b, a, ...]
}

export function readImage(filePath: string): RawImage {
  if (!fs.existsSync(filePath)) {
    throw new ImageProcessingError(`Image file not found: '${filePath}'`);
  }

  const ext = path.extname(filePath).toLowerCase();
  const fileBuffer = fs.readFileSync(filePath);

  try {
    if (ext === ".png") {
      const png = PNG.sync.read(fileBuffer);
      return {
        width: png.width,
        height: png.height,
        data: png.data,
      };
    } else if (ext === ".jpg" || ext === ".jpeg") {
      const rawJpeg = jpeg.decode(fileBuffer, { useTArray: false });
      return {
        width: rawJpeg.width,
        height: rawJpeg.height,
        data: rawJpeg.data,
      };
    } else {
      throw new ImageProcessingError(`Unsupported format: '${ext}'. Use .png, .jpg, or .jpeg.`);
    }
  } catch (err: any) {
    if (err instanceof ImageProcessingError) throw err;
    throw new ImageProcessingError(`Failed to decode image '${filePath}': ${err.message}`);
  }
}

export function writeImage(filePath: string, image: RawImage): void {
  const ext = path.extname(filePath).toLowerCase();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    if (ext === ".png") {
      const png = new PNG({ width: image.width, height: image.height });
      image.data.copy(png.data);
      const buffer = PNG.sync.write(png);
      fs.writeFileSync(filePath, buffer);
    } else if (ext === ".jpg" || ext === ".jpeg") {
      const jpegData = jpeg.encode(
        {
          data: image.data,
          width: image.width,
          height: image.height,
        },
        95
      );
      fs.writeFileSync(filePath, jpegData.data);
    } else {
      // Default to PNG
      const png = new PNG({ width: image.width, height: image.height });
      image.data.copy(png.data);
      const buffer = PNG.sync.write(png);
      fs.writeFileSync(filePath, buffer);
    }
  } catch (err: any) {
    throw new ImageProcessingError(`Failed to write image to '${filePath}': ${err.message}`);
  }
}

export function cloneImage(img: RawImage): RawImage {
  const buf = Buffer.alloc(img.data.length);
  img.data.copy(buf);
  return {
    width: img.width,
    height: img.height,
    data: buf,
  };
}
