import { z } from "zod";
export declare const AnalyzeOpticalInputSchema: z.ZodObject<{
    image_path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    image_path: string;
}, {
    image_path: string;
}>;
export declare const GenerateRelightInputSchema: z.ZodObject<{
    image_path: z.ZodString;
    target_lighting: z.ZodDefault<z.ZodEnum<["Ambient", "Dramatic", "Rim", "Mood", "All"]>>;
    output_dir: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    image_path: string;
    target_lighting: "Ambient" | "Dramatic" | "Rim" | "Mood" | "All";
    output_dir: string;
}, {
    image_path: string;
    target_lighting?: "Ambient" | "Dramatic" | "Rim" | "Mood" | "All" | undefined;
    output_dir?: string | undefined;
}>;
export declare const HarmonizeCompositeInputSchema: z.ZodObject<{
    foreground_path: z.ZodString;
    background_path: z.ZodString;
    blend_mode: z.ZodDefault<z.ZodEnum<["seamless", "alpha"]>>;
}, "strip", z.ZodTypeAny, {
    foreground_path: string;
    background_path: string;
    blend_mode: "seamless" | "alpha";
}, {
    foreground_path: string;
    background_path: string;
    blend_mode?: "seamless" | "alpha" | undefined;
}>;
export declare const SynthesizePromptInputSchema: z.ZodObject<{
    image_path: z.ZodString;
    user_intent: z.ZodDefault<z.ZodString>;
    target_model: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    image_path: string;
    user_intent: string;
    target_model: string;
}, {
    image_path: string;
    user_intent?: string | undefined;
    target_model?: string | undefined;
}>;
