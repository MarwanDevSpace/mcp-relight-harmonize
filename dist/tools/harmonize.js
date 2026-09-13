"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.harmonizeCompositeTool = harmonizeCompositeTool;
const crypto_1 = __importDefault(require("crypto"));
const envelope_1 = require("../core/envelope");
const errors_1 = require("../core/errors");
const harmonizer_1 = require("../domain/harmonizer");
function harmonizeCompositeTool(foregroundPath, backgroundPath, blendMode = "seamless") {
    try {
        const result = (0, harmonizer_1.harmonizeCompositeImpl)(foregroundPath, backgroundPath, blendMode);
        const hash = crypto_1.default
            .createHash("sha256")
            .update(`${foregroundPath}:${backgroundPath}:${blendMode}`)
            .digest("hex")
            .slice(0, 12);
        return (0, envelope_1.createEnvelope)("success", `Harmonized composite created with matched background color temperature (${result.backgroundCctKelvin}K) and contact shadow.`, result, {
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
        });
    }
    catch (err) {
        const isAppErr = err instanceof errors_1.AppError;
        const msg = err.message || "Harmonization failed.";
        const code = isAppErr ? err.code : "INTERNAL_ERROR";
        const hint = isAppErr ? err.actionableHint : "Ensure foreground and background images are valid files.";
        return (0, envelope_1.createEnvelope)("failed", `Harmonization failed: ${msg}`, { error_code: code, actionable_hint: hint }, {
            warnings: [msg],
            nextActions: [hint],
        });
    }
}
