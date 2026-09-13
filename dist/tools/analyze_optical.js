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
const layer_extractor_1 = require("../domain/layer_extractor");
function analyzeOpticalProfileTool(imagePath, extractLayers = false, layersDir, userIntent) {
    try {
        const report = (0, optical_analyzer_1.analyzeOpticalProfileImpl)(imagePath);
        const hash = crypto_1.default.createHash("sha256").update(imagePath).digest("hex").slice(0, 12);
        let layerReport;
        const artifacts = [];
        if (extractLayers || layersDir) {
            const targetDir = layersDir || "Layers";
            layerReport = (0, layer_extractor_1.extractLayersImpl)(imagePath, targetDir, userIntent);
            artifacts.push({ label: "Layer 1 - Highlights", uri: `file://${layerReport.layers.highlights.path}` }, { label: "Layer 2 - Shadows", uri: `file://${layerReport.layers.shadows.path}` }, { label: "Layer 3 - Ambient Occlusion", uri: `file://${layerReport.layers.ambientOcclusion.path}` }, { label: "Layer 4 - Edges", uri: `file://${layerReport.layers.edges.path}` }, { label: "Layer 5 - Depth Normals", uri: `file://${layerReport.layers.depthNormals.path}` }, { label: "Layer 6 - Chroma Saturation", uri: `file://${layerReport.layers.chromaSaturation.path}` }, { label: "Layer Markdown Report", uri: `file://${layerReport.layerMarkdownPath}` });
        }
        const payload = { ...report };
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
            nextActions.unshift(`Inspect 6 analytical layers and Layer.md, then present to user with prompt: 'ماذا تريد من تعديل؟'`);
        }
        return (0, envelope_1.createEnvelope)("success", `Optical profile extracted successfully: ${report.opticalProfileSummary}${layerReport ? ` (6 Analytical layers generated in '${layerReport.layersDirectory}')` : ""}`, payload, {
            evidence: {
                inputsDigest: `sha256:${hash}`,
                sources: [{ label: "Source Image", uri: `file://${report.imagePath}` }],
                artifacts,
            },
            nextActions,
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
