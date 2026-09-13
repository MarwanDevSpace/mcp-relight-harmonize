import crypto from "crypto";
import { createEnvelope, ResultEnvelope } from "../core/envelope";
import { AppError } from "../core/errors";
import { analyzeOpticalProfileImpl } from "../domain/optical_analyzer";

export function analyzeOpticalProfileTool(imagePath: string): ResultEnvelope {
  try {
    const report = analyzeOpticalProfileImpl(imagePath);
    const hash = crypto.createHash("sha256").update(imagePath).digest("hex").slice(0, 12);

    return createEnvelope(
      "success",
      `Optical profile extracted successfully: ${report.opticalProfileSummary}`,
      report,
      {
        evidence: {
          inputsDigest: `sha256:${hash}`,
          sources: [{ label: "Source Image", uri: `file://${report.imagePath}` }],
        },
        nextActions: [
          `Call 'generate_relight_variations' on '${imagePath}' to explore alternative lighting schemes.`,
          `Call 'synthesize_diffusion_prompt' targeting GPT Image or Nano Banana for high-res generative inpainting.`,
        ],
      }
    );
  } catch (err: any) {
    const isAppErr = err instanceof AppError;
    const msg = err.message || "Optical profiling failed.";
    const code = isAppErr ? err.code : "INTERNAL_ERROR";
    const hint = isAppErr ? err.actionableHint : "Verify image file accessibility.";

    return createEnvelope("failed", `Optical profiling failed: ${msg}`, { error_code: code, actionable_hint: hint }, {
      warnings: [msg],
      nextActions: [hint],
    });
  }
}
