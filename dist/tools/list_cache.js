"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCachedVariationsTool = listCachedVariationsTool;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config");
const envelope_1 = require("../core/envelope");
const errors_1 = require("../core/errors");
function listCachedVariationsTool(cacheDir) {
    try {
        const targetDir = cacheDir ? path_1.default.resolve(cacheDir) : (0, config_1.ensureOutputDirectory)();
        if (!fs_1.default.existsSync(targetDir)) {
            return (0, envelope_1.createEnvelope)("success", `Output cache directory is empty or does not yet exist: '${targetDir}'`, { cacheDirectory: targetDir, totalFiles: 0, files: [] }, { nextActions: ["Call 'generate_relight_variations' or 'harmonize_composite' to produce variations."] });
        }
        const entries = fs_1.default.readdirSync(targetDir, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            if (entry.isFile()) {
                const ext = path_1.default.extname(entry.name).toLowerCase();
                if (config_1.config.allowedExtensions.has(ext)) {
                    const fullPath = path_1.default.join(targetDir, entry.name);
                    const stat = fs_1.default.statSync(fullPath);
                    let itemType = "other";
                    if (entry.name.includes("_relight_")) {
                        itemType = "relight_variation";
                    }
                    else if (entry.name.startsWith("harmonized_")) {
                        itemType = "harmonized_composite";
                    }
                    files.push({
                        filename: entry.name,
                        path: fullPath,
                        sizeBytes: stat.size,
                        createdAt: stat.mtime.toISOString(),
                        type: itemType,
                    });
                }
            }
        }
        // Sort by most recent
        files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const hash = crypto_1.default.createHash("sha256").update(targetDir).digest("hex").slice(0, 12);
        return (0, envelope_1.createEnvelope)("success", `Found ${files.length} cached variation and composite artifacts in '${targetDir}'.`, { cacheDirectory: targetDir, totalFiles: files.length, files }, {
            evidence: {
                inputsDigest: `sha256:${hash}`,
                artifacts: files.map((f) => ({ label: f.filename, uri: `file://${f.path}` })),
            },
            nextActions: [
                "Call 'analyze_optical_profile' on any cached variation to evaluate its modified optical properties.",
                "Call 'synthesize_diffusion_prompt' to craft AI inpainting prompts from a cached variation.",
            ],
        });
    }
    catch (err) {
        const isAppErr = err instanceof errors_1.AppError;
        const msg = err.message || "Failed to list cached variations.";
        const code = isAppErr ? err.code : "INTERNAL_ERROR";
        const hint = isAppErr ? err.actionableHint : "Verify directory read permissions.";
        return (0, envelope_1.createEnvelope)("failed", `Listing cache failed: ${msg}`, { error_code: code, actionable_hint: hint }, {
            warnings: [msg],
            nextActions: [hint],
        });
    }
}
