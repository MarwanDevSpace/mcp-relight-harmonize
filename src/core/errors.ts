export class AppError extends Error {
  public readonly code: string;
  public readonly actionableHint: string;

  constructor(message: string, code = "INTERNAL_ERROR", actionableHint?: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.actionableHint = actionableHint || "Check server logs and input parameters.";
  }
}

export class InvalidPathError extends AppError {
  constructor(message: string, actionableHint?: string) {
    super(
      message,
      "INVALID_PATH",
      actionableHint || "Provide a valid, accessible image file path."
    );
  }
}

export class ImageProcessingError extends AppError {
  constructor(message: string, actionableHint?: string) {
    super(
      message,
      "IMAGE_PROCESSING_FAILED",
      actionableHint || "Verify that the file is an undamaged image in PNG or JPEG format."
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, actionableHint?: string) {
    super(
      message,
      "VALIDATION_ERROR",
      actionableHint || "Review tool parameter schemas and constraints."
    );
  }
}

export class SecurityError extends AppError {
  constructor(message: string, actionableHint?: string) {
    super(
      message,
      "SECURITY_VIOLATION",
      actionableHint || "Access restricted by server trust boundaries."
    );
  }
}
