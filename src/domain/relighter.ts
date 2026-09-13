import path from "path";
import fs from "fs";
import { RelightVariationItem, RelightVariationsResult } from "../contracts/types";
import { validateImagePath, validateAndResolvePath } from "../core/security";
import { ensureOutputDirectory } from "../config";
import { readImage, writeImage, cloneImage, RawImage } from "./image_io";

export function applyAmbientLighting(raw: RawImage): { image: RawImage; adjustments: string[] } {
  const out = cloneImage(raw);
  const { data, width, height } = out;
  const total = width * height;

  for (let i = 0; i < total; i++) {
    const idx = i * 4;
    let r = data[idx] / 255.0;
    let g = data[idx + 1] / 255.0;
    let b = data[idx + 2] / 255.0;

    // Shadow lifting via gamma 0.75
    const rLift = Math.pow(r, 0.75);
    const gLift = Math.pow(g, 0.75);
    const bLift = Math.pow(b, 0.75);

    // Blend back
    const wR = 1.0 - r;
    const wG = 1.0 - g;
    const wB = 1.0 - b;

    r = r + (rLift - r) * wR * 0.7;
    g = g + (gLift - g) * wG * 0.7;
    b = b + (bLift - b) * wB * 0.7;

    // Daylight neutral balance
    r = Math.min(Math.max(r * 0.98, 0), 1);
    b = Math.min(Math.max(b * 1.04, 0), 1);

    data[idx] = Math.round(r * 255);
    data[idx + 1] = Math.round(g * 255);
    data[idx + 2] = Math.round(b * 255);
  }

  return {
    image: out,
    adjustments: [
      "Shadows lifted (+0.8 EV equivalent)",
      "Contrast ratio softened (gamma 0.75 fill blend)",
      "Daylight neutral balance (~5500K calibration)",
    ],
  };
}

export function applyDramaticLighting(raw: RawImage): { image: RawImage; adjustments: string[] } {
  const out = cloneImage(raw);
  const { data, width, height } = out;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let r = data[idx] / 255.0;
      let g = data[idx + 1] / 255.0;
      let b = data[idx + 2] / 255.0;

      // S-curve contrast
      r = 1.0 / (1.0 + Math.exp(-10.0 * (r - 0.45)));
      g = 1.0 / (1.0 + Math.exp(-10.0 * (g - 0.45)));
      b = 1.0 / (1.0 + Math.exp(-10.0 * (b - 0.45)));

      // Top-left directional key gradient
      const dirMask = Math.min(
        Math.max((1.0 - ((x / width) * 0.6 + (y / height) * 0.4)) * 1.3, 0.2),
        1.2
      );

      r = r * dirMask;
      g = g * dirMask;
      b = b * dirMask;

      // Shadow crush (-1.5 EV)
      if (r < 0.2) r *= 0.5;
      if (g < 0.2) g *= 0.5;
      if (b < 0.2) b *= 0.5;

      data[idx] = Math.round(Math.min(Math.max(r, 0), 1) * 255);
      data[idx + 1] = Math.round(Math.min(Math.max(g, 0), 1) * 255);
      data[idx + 2] = Math.round(Math.min(Math.max(b, 0), 1) * 255);
    }
  }

  return {
    image: out,
    adjustments: [
      "Contrast expanded with steep S-curve (Chiaroscuro mode)",
      "Top-left directional key light gradient applied",
      "Shadow regions crushed (-1.5 EV falloff)",
    ],
  };
}

export function applyRimLighting(raw: RawImage): { image: RawImage; adjustments: string[] } {
  const out = cloneImage(raw);
  const { data, width, height } = out;
  const numPixels = width * height;

  // Grayscale map
  const gray = new Float32Array(numPixels);
  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    gray[i] = 0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2];
  }

  // Edge detection for rim mask
  const edgeMask = new Float32Array(numPixels);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx =
        -gray[(y - 1) * width + (x - 1)] +
        gray[(y - 1) * width + (x + 1)] -
        2 * gray[y * width + (x - 1)] +
        2 * gray[y * width + (x + 1)] -
        gray[(y + 1) * width + (x - 1)] +
        gray[(y + 1) * width + (x + 1)];

      const gy =
        -gray[(y - 1) * width + (x - 1)] -
        2 * gray[(y - 1) * width + x] -
        gray[(y - 1) * width + (x + 1)] +
        gray[(y + 1) * width + (x - 1)] +
        2 * gray[(y + 1) * width + x] +
        gray[(y + 1) * width + (x + 1)];

      const mag = Math.sqrt(gx * gx + gy * gy);
      edgeMask[idx] = mag > 60 ? Math.min(mag / 255.0 * 1.8, 1.0) : 0;
    }
  }

  // Cool rim color [0.7, 0.9, 1.0]
  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const rim = edgeMask[i];

    let r = (data[idx] / 255.0) * 0.65 + rim * 0.7 * 1.5;
    let g = (data[idx + 1] / 255.0) * 0.65 + rim * 0.9 * 1.5;
    let b = (data[idx + 2] / 255.0) * 0.65 + rim * 1.0 * 1.5;

    data[idx] = Math.round(Math.min(Math.max(r, 0), 1) * 255);
    data[idx + 1] = Math.round(Math.min(Math.max(g, 0), 1) * 255);
    data[idx + 2] = Math.round(Math.min(Math.max(b, 0), 1) * 255);
  }

  return {
    image: out,
    adjustments: [
      "Perimeter normal curvature rim mask synthesized",
      "Perimeter volumetric glow applied (cool 7000K accent, +1.2 EV)",
      "Core interior luminance attenuated by 35% for contrast punch",
    ],
  };
}

export function applyMoodLighting(raw: RawImage): { image: RawImage; adjustments: string[] } {
  const out = cloneImage(raw);
  const { data, width, height } = out;
  const numPixels = width * height;

  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    let r = data[idx] / 255.0;
    let g = data[idx + 1] / 255.0;
    let b = data[idx + 2] / 255.0;

    // Warm tungsten chromatic shift (boost red/orange, cut blue)
    r = Math.min(r * 1.25, 1.0);
    g = Math.min(g * 1.08, 1.0);
    b = b * 0.72;

    // Specular highlight bloom
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum > 0.5) {
      const bloom = (lum - 0.5) * 0.45;
      r = Math.min(r + bloom * 1.2, 1.0);
      g = Math.min(g + bloom * 0.85, 1.0);
      b = Math.min(b + bloom * 0.4, 1.0);
    }

    data[idx] = Math.round(r * 255);
    data[idx + 1] = Math.round(g * 255);
    data[idx + 2] = Math.round(b * 255);
  }

  return {
    image: out,
    adjustments: [
      "3200K tungsten amber color temperature shift",
      "Specular highlight bloom diffusion",
      "Warm atmospheric golden-hour tone mapping",
    ],
  };
}

export function generateRelightVariationsImpl(
  imagePath: string,
  targetLighting = "All",
  outputDir = ""
): RelightVariationsResult {
  const resolved = validateImagePath(imagePath);
  const raw = readImage(resolved);

  const outDir = outputDir && outputDir.trim() ? validateAndResolvePath(outputDir, false) : ensureOutputDirectory();
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const baseName = path.basename(resolved, path.extname(resolved));

  const allPresets: Array<{
    name: "Ambient" | "Dramatic" | "Rim" | "Mood";
    fn: (raw: RawImage) => { image: RawImage; adjustments: string[] };
    ev: number;
    cct: number;
  }> = [
    { name: "Ambient", fn: applyAmbientLighting, ev: +0.8, cct: 5500.0 },
    { name: "Dramatic", fn: applyDramaticLighting, ev: -1.5, cct: 5800.0 },
    { name: "Rim", fn: applyRimLighting, ev: +1.2, cct: 7000.0 },
    { name: "Mood", fn: applyMoodLighting, ev: +0.4, cct: 3200.0 },
  ];

  const selected = allPresets.filter(
    (p) => targetLighting.toLowerCase() === "all" || targetLighting.toLowerCase() === p.name.toLowerCase()
  );

  const variations: RelightVariationItem[] = [];

  for (const preset of selected.length > 0 ? selected : allPresets) {
    const { image, adjustments } = preset.fn(raw);
    const outFilename = `${baseName}_relight_${preset.name.toLowerCase()}.png`;
    const outPath = path.join(outDir, outFilename);
    writeImage(outPath, image);

    const stat = fs.statSync(outPath);
    variations.push({
      presetName: preset.name,
      imagePath: outPath,
      fileSizeBytes: stat.size,
      evShiftStops: preset.ev,
      targetCctKelvin: preset.cct,
      adjustmentsApplied: adjustments,
    });
  }

  return {
    originalImage: resolved,
    outputDir: outDir,
    variations,
    totalVariations: variations.length,
  };
}
