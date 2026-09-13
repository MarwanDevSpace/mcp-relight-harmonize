"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynthesizePromptInputSchema = exports.HarmonizeCompositeInputSchema = exports.GenerateRelightInputSchema = exports.AnalyzeOpticalInputSchema = void 0;
const zod_1 = require("zod");
exports.AnalyzeOpticalInputSchema = zod_1.z.object({
    image_path: zod_1.z.string().min(1).describe("Absolute or workspace-relative path to the input image file."),
});
exports.GenerateRelightInputSchema = zod_1.z.object({
    image_path: zod_1.z.string().min(1).describe("Path to the source image to relight."),
    target_lighting: zod_1.z
        .enum(["Ambient", "Dramatic", "Rim", "Mood", "All"])
        .default("All")
        .describe("Target illumination scheme: 'Ambient', 'Dramatic', 'Rim', 'Mood', or 'All' (default)."),
    output_dir: zod_1.z
        .string()
        .default("")
        .describe("Destination directory for generated variations. Defaults to cache directory."),
});
exports.HarmonizeCompositeInputSchema = zod_1.z.object({
    foreground_path: zod_1.z.string().min(1).describe("Path to the foreground subject cutout (PNG/JPG)."),
    background_path: zod_1.z.string().min(1).describe("Path to the background environment image."),
    blend_mode: zod_1.z
        .enum(["seamless", "alpha"])
        .default("seamless")
        .describe("Blending algorithm: 'seamless' (Reinhard + contact shadow) or 'alpha'."),
});
exports.SynthesizePromptInputSchema = zod_1.z.object({
    image_path: zod_1.z.string().min(1).describe("Path to the reference image."),
    user_intent: zod_1.z
        .string()
        .default("")
        .describe("Creative description or lighting scenario (e.g., 'sunset golden hour', 'studio product shot')."),
    target_model: zod_1.z
        .string()
        .default("universal")
        .describe("Target generative model format: 'universal' (Natural descriptive studio directives for Any Image Generator) or 'nano_banana' (GEMINI Nano Banana optical shader format)."),
});
