"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityError = exports.ValidationError = exports.ImageProcessingError = exports.InvalidPathError = exports.AppError = void 0;
class AppError extends Error {
    code;
    actionableHint;
    constructor(message, code = "INTERNAL_ERROR", actionableHint) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.actionableHint = actionableHint || "Check server logs and input parameters.";
    }
}
exports.AppError = AppError;
class InvalidPathError extends AppError {
    constructor(message, actionableHint) {
        super(message, "INVALID_PATH", actionableHint || "Provide a valid, accessible image file path.");
    }
}
exports.InvalidPathError = InvalidPathError;
class ImageProcessingError extends AppError {
    constructor(message, actionableHint) {
        super(message, "IMAGE_PROCESSING_FAILED", actionableHint || "Verify that the file is an undamaged image in PNG or JPEG format.");
    }
}
exports.ImageProcessingError = ImageProcessingError;
class ValidationError extends AppError {
    constructor(message, actionableHint) {
        super(message, "VALIDATION_ERROR", actionableHint || "Review tool parameter schemas and constraints.");
    }
}
exports.ValidationError = ValidationError;
class SecurityError extends AppError {
    constructor(message, actionableHint) {
        super(message, "SECURITY_VIOLATION", actionableHint || "Access restricted by server trust boundaries.");
    }
}
exports.SecurityError = SecurityError;
