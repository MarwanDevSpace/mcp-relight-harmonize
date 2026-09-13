import crypto from "crypto";
import { createEnvelope, ResultEnvelope } from "../core/envelope";
import { AppError } from "../core/errors";
import { synthesizeDiffusionPromptImpl } from "../domain/prompt_synthesizer";

export function synthesizeDiffusionPromptTool(
  imagePath: string,
  userIntent = "",
  targetModel = "universal"
): ResultEnvelope {
  try {
    const result = synthesizeDiffusionPromptImpl(imagePath, userIntent, targetModel);
    const hash = crypto
      .createHash("sha256")
      .update(`${imagePath}:${targetModel}:${userIntent}`)
      .digest("hex")
      .slice(0, 12);

    return createEnvelope(
      "success",
      `Synthesized enhancement and relighting prompts tailored for '${result.targetModel}' with calibrated parameters.`,
      result,
      {
        evidence: {
          inputsDigest: `sha256:${hash}`,
          sources: [{ label: "Input Image", uri: `file://${imagePath}` }],
        },
        nextActions: [
          `Paste the 'relightingPrompt' into your ${result.targetModel} generator.`,
          `Apply suggested denoising strength: ${result.recommendedParameters.denoising_strength}.`,
        ],
      }
    );
  } catch (err: any) {
    const isAppErr = err instanceof AppError;
    const msg = err.message || "Prompt synthesis failed.";
    const code = isAppErr ? err.code : "INTERNAL_ERROR";
    const hint = isAppErr ? err.actionableHint : "Verify image accessibility and parameters.";

    return createEnvelope("failed", `Prompt synthesis failed: ${msg}`, { error_code: code, actionable_hint: hint }, {
      warnings: [msg],
      nextActions: [hint],
    });
  }
}
