export declare class AppError extends Error {
    readonly code: string;
    readonly actionableHint: string;
    constructor(message: string, code?: string, actionableHint?: string);
}
export declare class InvalidPathError extends AppError {
    constructor(message: string, actionableHint?: string);
}
export declare class ImageProcessingError extends AppError {
    constructor(message: string, actionableHint?: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string, actionableHint?: string);
}
export declare class SecurityError extends AppError {
    constructor(message: string, actionableHint?: string);
}
