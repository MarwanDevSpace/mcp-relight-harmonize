"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeOpticalProfileTool = analyzeOpticalProfileTool;
const crypto_1 = __importDefault(require("crypto"));
const envelope_1 = require("../core/envelope");
const errors_1 = require("../core/errors");
const optical_analyzer_1 = require("../domain/optical_analyzer");
function analyzeOpticalProfileTool(imagePath) {
    try {
        const report = (0, optical_analyzer_1.analyzeOpticalProfileImpl)(imagePath);
        const hash = crypto_1.default.createHash("sha256").update(imagePath).digest("hex").slice(0, 12);
        return (0, envelope_1.createEnvelope)("success", `Optical profile extracted successfully: ${report.opticalProfileSummary}`, report, {
            evidence: {
                inputsDigest: `sha256:${hash}`,
                sources: [{ label: "Source Image", uri: `file://${report.imagePath}` }],
            },
            nextActions: [
                `Call 'generate_relight_variations' on '${imagePath}' to explore alternative lighting schemes.`,
                `Call 'synthesize_diffusion_prompt' targeting GPT Image or Nano Banana for high-res generative inpainting.`,
            ],
        });
    }
    catch (err) {
        const isAppErr = err instanceof errors_1.AppError;
        const msg = err.message || "Optical profiling failed.";
        const code = isAppErr ? err.code : "INTERNAL_ERROR";
        const hint = isAppErr ? err.actionableHint : "Verify image file accessibility.";
        return (0, envelope_1.createEnvelope)("failed", `Optical profiling failed: ${msg}`, { error_code: code, actionable_hint: hint }, {
            warnings: [msg],
            nextActions: [hint],
        });
    }
}
