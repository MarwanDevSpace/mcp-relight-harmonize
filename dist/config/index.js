"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.ensureOutputDirectory = ensureOutputDirectory;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
exports.config = {
    outputCacheDir: path_1.default.resolve(process.env.OUTPUT_CACHE_DIR || "./generated_variations"),
    maxFileSizeBytes: 50 * 1024 * 1024, // 50 MB
    allowedExtensions: new Set([".png", ".jpg", ".jpeg"]),
    colorTempD65Kelvin: 6504.0,
};
function ensureOutputDirectory() {
    if (!fs_1.default.existsSync(exports.config.outputCacheDir)) {
        fs_1.default.mkdirSync(exports.config.outputCacheDir, { recursive: true });
    }
    return exports.config.outputCacheDir;
}
