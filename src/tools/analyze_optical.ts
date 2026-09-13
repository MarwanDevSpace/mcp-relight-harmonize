import crypto from "crypto";
import { createEnvelope, ResultEnvelope } from "../core/envelope";
import { AppError } from "../core/errors";
import { analyzeOpticalProfileImpl } from "../domain/optical_analyzer";
import { extractLayersImpl, LayerExtractionReport } from "../domain/layer_extractor";

export function analyzeOpticalProfileTool(
  imagePath: string,
  extractLayers: boolean = false,
  layersDir?: string,
  userIntent?: string
): ResultEnvelope {
  try {
    const report = analyzeOpticalProfileImpl(imagePath);
    const hash = crypto.createHash("sha256").update(imagePath).digest("hex").slice(0, 12);

    let layerReport: LayerExtractionReport | undefined;
    const artifacts: Array<{ label: string; uri: string }> = [];

    if (extractLayers || layersDir) {
      const targetDir = layersDir || "Layers";
      layerReport = extractLayersImpl(imagePath, targetDir, userIntent);

      artifacts.push(
        { label: "Layer 1 - Highlights", uri: `file://${layerReport.layers.highlights.path}` },
        { label: "Layer 2 - Shadows", uri: `file://${layerReport.layers.shadows.path}` },
        { label: "Layer 3 - Ambient Occlusion", uri: `file://${layerReport.layers.ambientOcclusion.path}` },
        { label: "Layer 4 - Edges", uri: `file://${layerReport.layers.edges.path}` },
        { label: "Layer 5 - Depth Normals", uri: `file://${layerReport.layers.depthNormals.path}` },
        { label: "Layer 6 - Chroma Saturation", uri: `file://${layerReport.layers.chromaSaturation.path}` },
        { label: "Layer Markdown Report", uri: `file://${layerReport.layerMarkdownPath}` }
      );
    }

    const payload: any = { ...report };
    if (layerReport) {
      payload.layersDirectory = layerReport.layersDirectory;
      payload.layers = layerReport.layers;
      payload.layerMarkdownPath = layerReport.layerMarkdownPath;
    }

    const nextActions = [
      `Call 'generate_relight_variations' on '${imagePath}' to explore alternative lighting schemes.`,
      `Call 'synthesize_diffusion_prompt' for your Image Generator (GEMINI Nano Banana / Universal) or trigger 'generate_image'.`,
    ];

    if (layerReport) {
      nextActions.unshift(
        `Inspect 6 analytical layers and Layer.md, then present to user with prompt: 'ماذا تريد من تعديل؟'`
      );
    }

    return createEnvelope(
      "success",
      `Optical profile extracted successfully: ${report.opticalProfileSummary}${
        layerReport ? ` (6 Analytical layers generated in '${layerReport.layersDirectory}')` : ""
      }`,
      payload,
      {
        evidence: {
          inputsDigest: `sha256:${hash}`,
          sources: [{ label: "Source Image", uri: `file://${report.imagePath}` }],
          artifacts,
        },
        nextActions,
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
