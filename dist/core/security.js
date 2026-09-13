"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndResolvePath = validateAndResolvePath;
exports.validateImagePath = validateImagePath;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../config");
const errors_1 = require("./errors");
function validateAndResolvePath(pathStr, mustExist = true) {
    if (!pathStr || !pathStr.trim()) {
        throw new errors_1.InvalidPathError("Path cannot be empty.");
    }
    const resolved = path_1.default.resolve(pathStr.trim());
    if (mustExist && !fs_1.default.existsSync(resolved)) {
        throw new errors_1.InvalidPathError(`File or directory does not exist: '${resolved}'`);
    }
    return resolved;
}
function validateImagePath(pathStr) {
    const resolved = validateAndResolvePath(pathStr, true);
    const stat = fs_1.default.statSync(resolved);
    if (!stat.isFile()) {
        throw new errors_1.InvalidPathError(`Target path is not a file: '${resolved}'`);
    }
    const ext = path_1.default.extname(resolved).toLowerCase();
    if (!config_1.config.allowedExtensions.has(ext)) {
        throw new errors_1.InvalidPathError(`Unsupported image extension '${ext}'. Allowed extensions: ${Array.from(config_1.config.allowedExtensions).join(", ")}`);
    }
    if (stat.size > config_1.config.maxFileSizeBytes) {
        throw new errors_1.SecurityError(`File size (${(stat.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed size (${(config_1.config.maxFileSizeBytes /
            (1024 * 1024)).toFixed(2)} MB).`);
    }
    return resolved;
}
