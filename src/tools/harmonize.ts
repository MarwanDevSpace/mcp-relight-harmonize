import crypto from "crypto";
import { createEnvelope, ResultEnvelope } from "../core/envelope";
import { AppError } from "../core/errors";
import { harmonizeCompositeImpl } from "../domain/harmonizer";

export function harmonizeCompositeTool(
  foregroundPath: string,
  backgroundPath: string,
  blendMode = "seamless"
): ResultEnvelope {
  try {
    const result = harmonizeCompositeImpl(foregroundPath, backgroundPath, blendMode);
    const hash = crypto
      .createHash("sha256")
      .update(`${foregroundPath}:${backgroundPath}:${blendMode}`)
      .digest("hex")
      .slice(0, 12);

    return createEnvelope(
      "success",
      `Harmonized composite created with matched background color temperature (${result.backgroundCctKelvin}K) and contact shadow.`,
      result,
      {
        evidence: {
          inputsDigest: `sha256:${hash}`,
          sources: [
            { label: "Foreground Cutout", uri: `file://${result.foregroundPath}` },
            { label: "Background Scene", uri: `file://${result.backgroundPath}` },
          ],
          artifacts: [
            {
              label: "Harmonized Composite",
              uri: `file://${result.compositeImagePath}`,
            },
          ],
        },
        nextActions: [
          `Inspect the composite output at '${result.compositeImagePath}'.`,
          "Call 'synthesize_diffusion_prompt' targeting GPT Image or Nano Banana for seamless boundary inpainting.",
        ],
      }
    );
  } catch (err: any) {
    const isAppErr = err instanceof AppError;
    const msg = err.message || "Harmonization failed.";
    const code = isAppErr ? err.code : "INTERNAL_ERROR";
    const hint = isAppErr ? err.actionableHint : "Ensure foreground and background images are valid files.";

    return createEnvelope("failed", `Harmonization failed: ${msg}`, { error_code: code, actionable_hint: hint }, {
      warnings: [msg],
      nextActions: [hint],
    });
  }
}
