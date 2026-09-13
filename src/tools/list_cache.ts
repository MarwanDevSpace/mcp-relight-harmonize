import fs from "fs";
import path from "path";
import crypto from "crypto";
import { config, ensureOutputDirectory } from "../config";
import { createEnvelope, ResultEnvelope } from "../core/envelope";
import { AppError } from "../core/errors";

export interface CachedItem {
  filename: string;
  path: string;
  sizeBytes: number;
  createdAt: string;
  type: "relight_variation" | "harmonized_composite" | "other";
}

export function listCachedVariationsTool(cacheDir?: string): ResultEnvelope {
  try {
    const targetDir = cacheDir ? path.resolve(cacheDir) : ensureOutputDirectory();

    if (!fs.existsSync(targetDir)) {
      return createEnvelope(
        "success",
        `Output cache directory is empty or does not yet exist: '${targetDir}'`,
        { cacheDirectory: targetDir, totalFiles: 0, files: [] },
        { nextActions: ["Call 'generate_relight_variations' or 'harmonize_composite' to produce variations."] }
      );
    }

    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const files: CachedItem[] = [];

    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (config.allowedExtensions.has(ext)) {
          const fullPath = path.join(targetDir, entry.name);
          const stat = fs.statSync(fullPath);

          let itemType: CachedItem["type"] = "other";
          if (entry.name.includes("_relight_")) {
            itemType = "relight_variation";
          } else if (entry.name.startsWith("harmonized_")) {
            itemType = "harmonized_composite";
          }

          files.push({
            filename: entry.name,
            path: fullPath,
            sizeBytes: stat.size,
            createdAt: stat.mtime.toISOString(),
            type: itemType,
          });
        }
      }
    }

    // Sort by most recent
    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const hash = crypto.createHash("sha256").update(targetDir).digest("hex").slice(0, 12);

    return createEnvelope(
      "success",
      `Found ${files.length} cached variation and composite artifacts in '${targetDir}'.`,
      { cacheDirectory: targetDir, totalFiles: files.length, files },
      {
        evidence: {
          inputsDigest: `sha256:${hash}`,
          artifacts: files.map((f) => ({ label: f.filename, uri: `file://${f.path}` })),
        },
        nextActions: [
          "Call 'analyze_optical_profile' on any cached variation to evaluate its modified optical properties.",
          "Call 'synthesize_diffusion_prompt' to craft AI inpainting prompts from a cached variation.",
        ],
      }
    );
  } catch (err: any) {
    const isAppErr = err instanceof AppError;
    const msg = err.message || "Failed to list cached variations.";
    const code = isAppErr ? err.code : "INTERNAL_ERROR";
    const hint = isAppErr ? err.actionableHint : "Verify directory read permissions.";

    return createEnvelope("failed", `Listing cache failed: ${msg}`, { error_code: code, actionable_hint: hint }, {
      warnings: [msg],
      nextActions: [hint],
    });
  }
}
