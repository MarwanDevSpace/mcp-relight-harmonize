import path from "path";
import fs from "fs";

export interface ServerConfig {
  outputCacheDir: string;
  maxFileSizeBytes: number;
  allowedExtensions: Set<string>;
  colorTempD65Kelvin: number;
}

export const config: ServerConfig = {
  outputCacheDir: path.resolve(process.env.OUTPUT_CACHE_DIR || "./generated_variations"),
  maxFileSizeBytes: 50 * 1024 * 1024, // 50 MB
  allowedExtensions: new Set([".png", ".jpg", ".jpeg"]),
  colorTempD65Kelvin: 6504.0,
};

export function ensureOutputDirectory(): string {
  if (!fs.existsSync(config.outputCacheDir)) {
    fs.mkdirSync(config.outputCacheDir, { recursive: true });
  }
  return config.outputCacheDir;
}
