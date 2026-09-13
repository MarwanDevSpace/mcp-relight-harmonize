import path from "path";
import fs from "fs";
import { config } from "../config";
import { InvalidPathError, SecurityError } from "./errors";

export function validateAndResolvePath(pathStr: string, mustExist = true): string {
  if (!pathStr || !pathStr.trim()) {
    throw new InvalidPathError("Path cannot be empty.");
  }

  const resolved = path.resolve(pathStr.trim());

  if (mustExist && !fs.existsSync(resolved)) {
    throw new InvalidPathError(`File or directory does not exist: '${resolved}'`);
  }

  return resolved;
}

export function validateImagePath(pathStr: string): string {
  const resolved = validateAndResolvePath(pathStr, true);
  const stat = fs.statSync(resolved);

  if (!stat.isFile()) {
    throw new InvalidPathError(`Target path is not a file: '${resolved}'`);
  }

  const ext = path.extname(resolved).toLowerCase();
  if (!config.allowedExtensions.has(ext)) {
    throw new InvalidPathError(
      `Unsupported image extension '${ext}'. Allowed extensions: ${Array.from(config.allowedExtensions).join(", ")}`
    );
  }

  if (stat.size > config.maxFileSizeBytes) {
    throw new SecurityError(
      `File size (${(stat.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed size (${(
        config.maxFileSizeBytes /
        (1024 * 1024)
      ).toFixed(2)} MB).`
    );
  }

  return resolved;
}
