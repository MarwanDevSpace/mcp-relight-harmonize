"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.synthesizeDiffusionPromptTool = synthesizeDiffusionPromptTool;
const crypto_1 = __importDefault(require("crypto"));
const envelope_1 = require("../core/envelope");
const errors_1 = require("../core/errors");
const prompt_synthesizer_1 = require("../domain/prompt_synthesizer");
function synthesizeDiffusionPromptTool(imagePath, userIntent = "", targetModel = "universal") {
    try {
        const result = (0, prompt_synthesizer_1.synthesizeDiffusionPromptImpl)(imagePath, userIntent, targetModel);
        const hash = crypto_1.default
            .createHash("sha256")
            .update(`${imagePath}:${targetModel}:${userIntent}`)
            .digest("hex")
            .slice(0, 12);
        return (0, envelope_1.createEnvelope)("success", `Synthesized enhancement and relighting prompts tailored for '${result.targetModel}' with calibrated parameters.`, result, {
            evidence: {
                inputsDigest: `sha256:${hash}`,
                sources: [{ label: "Input Image", uri: `file://${imagePath}` }],
            },
            nextActions: [
                `Execute directly via Image Generator (e.g. generate_image / GEMINI Nano Banana in Antigravity).`,
                `Utilize 'detailedJsonSpecification' for structured parameter control and 'masterDescriptivePrompt' for photorealistic visual generation.`,
            ],
        });
    }
    catch (err) {
        const isAppErr = err instanceof errors_1.AppError;
        const msg = err.message || "Prompt synthesis failed.";
        const code = isAppErr ? err.code : "INTERNAL_ERROR";
        const hint = isAppErr ? err.actionableHint : "Verify image accessibility and parameters.";
        return (0, envelope_1.createEnvelope)("failed", `Prompt synthesis failed: ${msg}`, { error_code: code, actionable_hint: hint }, {
            warnings: [msg],
            nextActions: [hint],
        });
    }
}
