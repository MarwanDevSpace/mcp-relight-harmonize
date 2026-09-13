"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRelightVariationsTool = generateRelightVariationsTool;
const crypto_1 = __importDefault(require("crypto"));
const envelope_1 = require("../core/envelope");
const errors_1 = require("../core/errors");
const relighter_1 = require("../domain/relighter");
function generateRelightVariationsTool(imagePath, targetLighting = "All", outputDir = "") {
    try {
        const result = (0, relighter_1.generateRelightVariationsImpl)(imagePath, targetLighting, outputDir);
        const hash = crypto_1.default.createHash("sha256").update(imagePath).digest("hex").slice(0, 12);
        const artifacts = result.variations.map((v) => ({
            label: `${v.presetName} Variation`,
            uri: `file://${v.imagePath}`,
        }));
        const presetNames = result.variations.map((v) => v.presetName).join(", ");
        return (0, envelope_1.createEnvelope)("success", `Generated ${result.totalVariations} relit variations (${presetNames}) in '${result.outputDir}'.`, result, {
            evidence: {
                inputsDigest: `sha256:${hash}`,
                sources: [{ label: "Input Image", uri: `file://${result.originalImage}` }],
                artifacts,
            },
            nextActions: [
                "Review generated variation files to inspect aesthetic illumination.",
                "Use 'synthesize_diffusion_prompt' for your Image Generator (GEMINI Nano Banana / Universal) or trigger 'generate_image'.",
            ],
        });
    }
    catch (err) {
        const isAppErr = err instanceof errors_1.AppError;
        const msg = err.message || "Variation generation failed.";
        const code = isAppErr ? err.code : "INTERNAL_ERROR";
        const hint = isAppErr ? err.actionableHint : "Check output directory permissions and input image.";
        return (0, envelope_1.createEnvelope)("failed", `Variation generation failed: ${msg}`, { error_code: code, actionable_hint: hint }, {
            warnings: [msg],
            nextActions: [hint],
        });
    }
}
