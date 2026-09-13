import crypto from "crypto";
import { createEnvelope, ResultEnvelope } from "../core/envelope";
import { AppError } from "../core/errors";
import { generateRelightVariationsImpl } from "../domain/relighter";

export function generateRelightVariationsTool(
  imagePath: string,
  targetLighting = "All",
  outputDir = ""
): ResultEnvelope {
  try {
    const result = generateRelightVariationsImpl(imagePath, targetLighting, outputDir);
    const hash = crypto.createHash("sha256").update(imagePath).digest("hex").slice(0, 12);

    const artifacts = result.variations.map((v) => ({
      label: `${v.presetName} Variation`,
      uri: `file://${v.imagePath}`,
    }));

    const presetNames = result.variations.map((v) => v.presetName).join(", ");

    return createEnvelope(
      "success",
      `Generated ${result.totalVariations} relit variations (${presetNames}) in '${result.outputDir}'.`,
      result,
      {
        evidence: {
          inputsDigest: `sha256:${hash}`,
          sources: [{ label: "Input Image", uri: `file://${result.originalImage}` }],
          artifacts,
        },
        nextActions: [
          "Review generated variation files to inspect aesthetic illumination.",
          "Use 'synthesize_diffusion_prompt' for GPT Image or Nano Banana generative enhancement.",
        ],
      }
    );
  } catch (err: any) {
    const isAppErr = err instanceof AppError;
    const msg = err.message || "Variation generation failed.";
    const code = isAppErr ? err.code : "INTERNAL_ERROR";
    const hint = isAppErr ? err.actionableHint : "Check output directory permissions and input image.";

    return createEnvelope("failed", `Variation generation failed: ${msg}`, { error_code: code, actionable_hint: hint }, {
      warnings: [msg],
      nextActions: [hint],
    });
  }
}
