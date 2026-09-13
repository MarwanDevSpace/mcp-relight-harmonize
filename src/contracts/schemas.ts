import { z } from "zod";

export const AnalyzeOpticalInputSchema = z.object({
  image_path: z.string().min(1).describe("Absolute or workspace-relative path to the input image file."),
});

export const GenerateRelightInputSchema = z.object({
  image_path: z.string().min(1).describe("Path to the source image to relight."),
  target_lighting: z
    .enum(["Ambient", "Dramatic", "Rim", "Mood", "All"])
    .default("All")
    .describe("Target illumination scheme: 'Ambient', 'Dramatic', 'Rim', 'Mood', or 'All' (default)."),
  output_dir: z
    .string()
    .default("")
    .describe("Destination directory for generated variations. Defaults to cache directory."),
});

export const HarmonizeCompositeInputSchema = z.object({
  foreground_path: z.string().min(1).describe("Path to the foreground subject cutout (PNG/JPG)."),
  background_path: z.string().min(1).describe("Path to the background environment image."),
  blend_mode: z
    .enum(["seamless", "alpha"])
    .default("seamless")
    .describe("Blending algorithm: 'seamless' (Reinhard + contact shadow) or 'alpha'."),
});

export const SynthesizePromptInputSchema = z.object({
  image_path: z.string().min(1).describe("Path to the reference image."),
  user_intent: z
    .string()
    .default("")
    .describe("Creative description or lighting scenario (e.g., 'sunset golden hour', 'studio product shot')."),
  target_model: z
    .string()
    .default("universal")
    .describe("Target generative model format: 'universal' (Natural descriptive studio directives for Any Image Generator) or 'nano_banana' (GEMINI Nano Banana optical shader format)."),
});
