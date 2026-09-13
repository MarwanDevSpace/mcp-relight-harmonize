"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const analyze_optical_1 = require("./tools/analyze_optical");
const generate_relight_1 = require("./tools/generate_relight");
const harmonize_1 = require("./tools/harmonize");
const synthesize_prompt_1 = require("./tools/synthesize_prompt");
const list_cache_1 = require("./tools/list_cache");
const presets_1 = require("./resources/presets");
// Common output envelope schema definition
const StandardEnvelopeSchema = {
    type: "object",
    properties: {
        status: { type: "string", enum: ["success", "partial", "blocked", "failed"], description: "Execution status." },
        summary: { type: "string", description: "Human-readable executive summary of the operation." },
        data: { type: "object", description: "Typed domain payload." },
        warnings: { type: "array", items: { type: "string" }, description: "Non-fatal warnings if applicable." },
        evidence: {
            type: "object",
            properties: {
                inputsDigest: { type: "string", description: "SHA-256 digest of input parameters." },
                sources: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: { label: { type: "string" }, uri: { type: "string" } },
                        required: ["label"],
                    },
                },
                artifacts: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: { label: { type: "string" }, uri: { type: "string" } },
                        required: ["label"],
                    },
                },
            },
        },
        nextActions: { type: "array", items: { type: "string" }, description: "Actionable follow-up guidance." },
    },
    required: ["status", "summary", "data", "warnings", "evidence", "nextActions"],
};
function createServer() {
    const server = new index_js_1.Server({
        name: "mcp-relight-harmonize",
        version: "1.0.2",
    }, {
        capabilities: {
            tools: {},
            resources: {},
        },
    });
    // List Tools Handler
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: "analyze_optical_profile",
                    description: "Extract physical optical metrics from an image, including Correlated Color Temperature (CCT in Kelvin), " +
                        "dominant 3D lighting vector (azimuth and elevation angles), photometric luminance dynamic range, contrast zones, " +
                        "and surface normal roughness index.\n\n" +
                        "• Purpose: Diagnostic optical extraction. Unlike 'generate_relight_variations', this tool produces no image files, " +
                        "and unlike 'synthesize_diffusion_prompt', it returns pure numerical color-science data rather than text prompts.\n" +
                        "• Behavior: Completely read-only, deterministic, zero filesystem modifications, no network egress, and no authentication required.\n" +
                        "• When to use: Use as the prerequisite first step before relighting, inpainting, or compositing an image to inspect baseline lighting conditions.\n" +
                        "• When NOT to use: Do NOT use if you need modified image files on disk (use 'generate_relight_variations'), if merging a cutout into a scene " +
                        "(use 'harmonize_composite'), or if you need generative AI prompts (use 'synthesize_diffusion_prompt').\n" +
                        "• Alternatives: Use 'generate_relight_variations' for visual lighting files, or 'synthesize_diffusion_prompt' for model prompts.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            image_path: {
                                type: "string",
                                description: "Absolute or workspace-relative path to a local image file (.png, .jpg, or .jpeg). " +
                                    "Must be an existing image under 50 MB.",
                            },
                        },
                        required: ["image_path"],
                    },
                    outputSchema: {
                        ...StandardEnvelopeSchema,
                        properties: {
                            ...StandardEnvelopeSchema.properties,
                            data: {
                                type: "object",
                                properties: {
                                    imagePath: { type: "string", description: "Canonical resolved file path." },
                                    dimensions: { type: "array", items: { type: "number" }, description: "[width, height] in pixels." },
                                    colorTemperatureKelvin: { type: "number", description: "Correlated Color Temperature (CCT) in Kelvin." },
                                    dominantLightDirectionVector: { type: "array", items: { type: "number" }, description: "Normalized [X, Y, Z] vector." },
                                    lightingAngles: {
                                        type: "object",
                                        properties: {
                                            azimuthDeg: { type: "number", description: "Horizontal angle (0-360°)." },
                                            elevationDeg: { type: "number", description: "Vertical elevation angle (0-90°)." },
                                        },
                                        required: ["azimuthDeg", "elevationDeg"],
                                    },
                                    meanLuminance: { type: "number", description: "Average photometric luminance (0-255)." },
                                    luminanceDynamics: {
                                        type: "object",
                                        properties: {
                                            min: { type: "number" },
                                            max: { type: "number" },
                                            p5: { type: "number" },
                                            median: { type: "number" },
                                            p95: { type: "number" },
                                            contrastRatio: { type: "number" },
                                        },
                                    },
                                    contrastZones: {
                                        type: "object",
                                        properties: {
                                            specularHighlightsPct: { type: "number" },
                                            deepShadowsPct: { type: "number" },
                                            midtonesPct: { type: "number" },
                                        },
                                    },
                                    surfaceNormalVariation: { type: "number", description: "Roughness metric (std dev of normals)." },
                                    opticalProfileSummary: { type: "string", description: "Executive summary sentence." },
                                },
                                required: [
                                    "imagePath",
                                    "dimensions",
                                    "colorTemperatureKelvin",
                                    "dominantLightDirectionVector",
                                    "lightingAngles",
                                    "meanLuminance",
                                    "luminanceDynamics",
                                    "contrastZones",
                                    "surfaceNormalVariation",
                                    "opticalProfileSummary",
                                ],
                            },
                        },
                    },
                },
                {
                    name: "generate_relight_variations",
                    description: "Generate 4 physically-grounded relit image variations on disk (Ambient fill, Dramatic chiaroscuro, " +
                        "Rim light halo, Mood golden-hour) with mathematical adjustment logs detailing exposure compensation (EV stops) and color balance.\n\n" +
                        "• Purpose: Visual image transformation. Unlike 'analyze_optical_profile' which is read-only, this tool renders and writes concrete " +
                        "image files to the destination directory. Unlike 'synthesize_diffusion_prompt', it produces immediate local image files.\n" +
                        "• Behavior: Mutates filesystem by creating up to 4 image files in the output directory. Deterministic, unmetered local compute, " +
                        "no network egress, no authentication required. Re-running overwrites previous variations with the same base name.\n" +
                        "• When to use: Use when you need tangible image alternatives of a photo or product render with alternative lighting schemes.\n" +
                        "• When NOT to use: Do NOT use if you only need optical metrics (use 'analyze_optical_profile'), if blending a cutout into a background " +
                        "(use 'harmonize_composite'), or if you need diffusion AI text prompts (use 'synthesize_diffusion_prompt').\n" +
                        "• Alternatives: Use 'synthesize_diffusion_prompt' for text prompts targeting GPT Image or Nano Banana, or 'list_cached_variations' to browse existing outputs.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            image_path: {
                                type: "string",
                                description: "Path to the input image (.png, .jpg, .jpeg) to relight.",
                            },
                            target_lighting: {
                                type: "string",
                                enum: ["Ambient", "Dramatic", "Rim", "Mood", "All"],
                                default: "All",
                                description: "Lighting preset selection: 'Ambient' (+0.8 EV lifted shadows, 5500K daylight), " +
                                    "'Dramatic' (-1.5 EV shadow crush, chiaroscuro S-curve), 'Rim' (+1.2 EV normal curvature perimeter halo), " +
                                    "'Mood' (3200K tungsten amber shift, highlight bloom), or 'All' to generate all four simultaneously. Defaults to 'All'.",
                            },
                            output_dir: {
                                type: "string",
                                default: "",
                                description: "Destination folder for generated variation image files. If omitted, defaults to the server's configured cache directory ('./generated_variations').",
                            },
                        },
                        required: ["image_path"],
                    },
                    outputSchema: {
                        ...StandardEnvelopeSchema,
                        properties: {
                            ...StandardEnvelopeSchema.properties,
                            data: {
                                type: "object",
                                properties: {
                                    originalImage: { type: "string" },
                                    outputDir: { type: "string" },
                                    totalVariations: { type: "number" },
                                    variations: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                presetName: { type: "string" },
                                                imagePath: { type: "string" },
                                                fileSizeBytes: { type: "number" },
                                                evShiftStops: { type: "number" },
                                                targetCctKelvin: { type: "number" },
                                                adjustmentsApplied: { type: "array", items: { type: "string" } },
                                            },
                                            required: ["presetName", "imagePath", "fileSizeBytes", "evShiftStops", "targetCctKelvin", "adjustmentsApplied"],
                                        },
                                    },
                                },
                                required: ["originalImage", "outputDir", "totalVariations", "variations"],
                            },
                        },
                    },
                },
                {
                    name: "harmonize_composite",
                    description: "Harmonize and composite a foreground subject cutout onto a background environment scene image using Reinhard " +
                        "color statistics transfer in decorrelated lαβ space, background color temperature matching, and synthesized ground contact shadows.\n\n" +
                        "• Purpose: Two-image compositing and photometric harmonization. Distinct from 'generate_relight_variations' which operates on a single image, " +
                        "this tool resolves color mismatches and grounding between two separate image sources.\n" +
                        "• Behavior: Mutates filesystem by writing 1 composited PNG image to the output cache directory. Deterministic, local execution, " +
                        "no network egress, no authentication required.\n" +
                        "• When to use: Use when placing a cutout product, character, or object onto a new background environment scene, ensuring realistic color adaptation and floor shadows.\n" +
                        "• When NOT to use: Do NOT use to relight a single standalone image (use 'generate_relight_variations'), or to analyze metrics alone (use 'analyze_optical_profile').\n" +
                        "• Alternatives: Use 'generate_relight_variations' to alter lighting on a single image, or 'synthesize_diffusion_prompt' to craft inpainting prompts for seam blending.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            foreground_path: {
                                type: "string",
                                description: "Path to foreground subject image. Supports transparent PNG (with alpha channel) or solid background.",
                            },
                            background_path: {
                                type: "string",
                                description: "Path to target background scene image (.png, .jpg, .jpeg).",
                            },
                            blend_mode: {
                                type: "string",
                                enum: ["seamless", "alpha"],
                                default: "seamless",
                                description: "Blending mode: 'seamless' (applies Reinhard color transfer + contact shadow + alpha blend) " +
                                    "or 'alpha' (standard alpha composite with contact shadow only). Defaults to 'seamless'.",
                            },
                        },
                        required: ["foreground_path", "background_path"],
                    },
                    outputSchema: {
                        ...StandardEnvelopeSchema,
                        properties: {
                            ...StandardEnvelopeSchema.properties,
                            data: {
                                type: "object",
                                properties: {
                                    compositeImagePath: { type: "string", description: "Absolute path to the rendered composite file on disk." },
                                    blendMode: { type: "string" },
                                    foregroundPath: { type: "string" },
                                    backgroundPath: { type: "string" },
                                    backgroundCctKelvin: { type: "number", description: "Target background color temperature." },
                                    luminanceScalingFactor: { type: "number" },
                                    contactShadowApplied: { type: "boolean", description: "True if contact shadow was synthesized at base." },
                                    details: { type: "object" },
                                },
                                required: [
                                    "compositeImagePath",
                                    "blendMode",
                                    "foregroundPath",
                                    "backgroundPath",
                                    "backgroundCctKelvin",
                                    "luminanceScalingFactor",
                                    "contactShadowApplied",
                                ],
                            },
                        },
                    },
                },
                {
                    name: "synthesize_diffusion_prompt",
                    description: "Synthesize precision enhancement and relighting diffusion prompts based on physical optical analysis of an image, " +
                        "tailored specifically for GPT Image (DALL-E 3 / GPT-4o) and Nano Banana. Outputs photorealistic prompts with physical keywords " +
                        "(exact Kelvin CCT, 3D light angles, volumetric dust rays, contact shadows) and calibrated denoising parameters (0.35 - 0.45).\n\n" +
                        "• Purpose: Generative AI prompt synthesis. Unlike 'generate_relight_variations' which creates image files locally, this tool translates " +
                        "optical geometry into targeted text prompts and hyperparameter sets for external diffusion generators.\n" +
                        "• Behavior: Completely read-only, deterministic, zero filesystem modifications, no network calls, and no authentication required.\n" +
                        "• When to use: Use when you want to feed photorealistic lighting directives or inpainting prompts into GPT Image or Nano Banana.\n" +
                        "• When NOT to use: Do NOT use if you need local image rendering without an external AI model (use 'generate_relight_variations'), " +
                        "or if merging cutouts locally (use 'harmonize_composite').\n" +
                        "• Alternatives: Use 'generate_relight_variations' for instant offline image files, or 'analyze_optical_profile' for raw numerical statistics.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            image_path: {
                                type: "string",
                                description: "Path to the local reference image (.png, .jpg, .jpeg) to extract optical geometry from.",
                            },
                            user_intent: {
                                type: "string",
                                default: "",
                                description: "Optional creative context or scenario description (e.g., 'golden sunset portrait', 'cyberpunk studio product').",
                            },
                            target_model: {
                                type: "string",
                                enum: ["gpt_image", "nano_banana"],
                                default: "gpt_image",
                                description: "Target generative engine: 'gpt_image' (outputs natural descriptive studio directives with 85mm prime lens and physical illumination) " +
                                    "or 'nano_banana' (outputs dense tokenized optical shaders, roughness index, raytraced bounce, and ground contact shadow). Defaults to 'gpt_image'.",
                            },
                        },
                        required: ["image_path"],
                    },
                    outputSchema: {
                        ...StandardEnvelopeSchema,
                        properties: {
                            ...StandardEnvelopeSchema.properties,
                            data: {
                                type: "object",
                                properties: {
                                    targetModel: { type: "string", enum: ["GPT Image", "Nano Banana"] },
                                    userIntent: { type: "string" },
                                    enhancementPrompt: { type: "string", description: "Prompt for micro-surface detail and lens clarity upgrade." },
                                    relightingPrompt: { type: "string", description: "Prompt for physical relighting with angles, CCT, and contact shadows." },
                                    recommendedParameters: { type: "object", description: "Calibrated diffusion settings (denoising 0.35-0.45, etc.)." },
                                    opticalKeywordsUsed: { type: "array", items: { type: "string" } },
                                },
                                required: [
                                    "targetModel",
                                    "userIntent",
                                    "enhancementPrompt",
                                    "relightingPrompt",
                                    "recommendedParameters",
                                    "opticalKeywordsUsed",
                                ],
                            },
                        },
                    },
                },
                {
                    name: "list_cached_variations",
                    description: "List and inspect all previously generated relight variation images and harmonized composite files stored in the output cache directory.\n\n" +
                        "• Purpose: Cache inventory and artifact retrieval. Resolves pipeline completeness by allowing callers to discover, verify, " +
                        "and retrieve generated files without manual filesystem traversal.\n" +
                        "• Behavior: Completely read-only, queries local filesystem cache directory, no network calls, no authentication required.\n" +
                        "• When to use: Use after running 'generate_relight_variations' or 'harmonize_composite' to verify written artifacts, inspect file sizes, " +
                        "and obtain exact paths for downstream analysis.\n" +
                        "• When NOT to use: Do NOT use to generate new images (use 'generate_relight_variations') or to analyze optical metrics (use 'analyze_optical_profile').\n" +
                        "• Alternatives: Use 'generate_relight_variations' to create new images, or 'harmonize_composite' to merge cutouts.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            cache_dir: {
                                type: "string",
                                default: "",
                                description: "Optional custom directory path to inspect. If omitted, uses server's default cache directory.",
                            },
                        },
                    },
                    outputSchema: {
                        ...StandardEnvelopeSchema,
                        properties: {
                            ...StandardEnvelopeSchema.properties,
                            data: {
                                type: "object",
                                properties: {
                                    cacheDirectory: { type: "string" },
                                    totalFiles: { type: "number" },
                                    files: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                filename: { type: "string" },
                                                path: { type: "string" },
                                                sizeBytes: { type: "number" },
                                                createdAt: { type: "string" },
                                                type: { type: "string", enum: ["relight_variation", "harmonized_composite", "other"] },
                                            },
                                            required: ["filename", "path", "sizeBytes", "createdAt", "type"],
                                        },
                                    },
                                },
                                required: ["cacheDirectory", "totalFiles", "files"],
                            },
                        },
                    },
                },
            ],
        };
    });
    // Call Tool Handler
    server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
        const { name, arguments: args = {} } = request.params;
        let envelope;
        switch (name) {
            case "analyze_optical_profile": {
                const imagePath = String(args.image_path || "");
                envelope = (0, analyze_optical_1.analyzeOpticalProfileTool)(imagePath);
                break;
            }
            case "generate_relight_variations": {
                const imagePath = String(args.image_path || "");
                const targetLighting = String(args.target_lighting || "All");
                const outputDir = String(args.output_dir || "");
                envelope = (0, generate_relight_1.generateRelightVariationsTool)(imagePath, targetLighting, outputDir);
                break;
            }
            case "harmonize_composite": {
                const fgPath = String(args.foreground_path || "");
                const bgPath = String(args.background_path || "");
                const blendMode = String(args.blend_mode || "seamless");
                envelope = (0, harmonize_1.harmonizeCompositeTool)(fgPath, bgPath, blendMode);
                break;
            }
            case "synthesize_diffusion_prompt": {
                const imagePath = String(args.image_path || "");
                const userIntent = String(args.user_intent || "");
                const targetModel = String(args.target_model || "gpt_image");
                envelope = (0, synthesize_prompt_1.synthesizeDiffusionPromptTool)(imagePath, userIntent, targetModel);
                break;
            }
            case "list_cached_variations": {
                const cacheDir = args.cache_dir ? String(args.cache_dir) : undefined;
                envelope = (0, list_cache_1.listCachedVariationsTool)(cacheDir);
                break;
            }
            default:
                throw new Error(`Unknown tool: '${name}'`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(envelope, null, 2),
                },
            ],
        };
    });
    // List Resources Handler
    server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
        return {
            resources: [
                {
                    uri: "optical://presets",
                    name: "Lighting Presets Specification",
                    description: "Physical reference definitions for Ambient, Dramatic, Rim, and Mood lighting presets.",
                    mimeType: "application/json",
                },
            ],
        };
    });
    // Read Resource Handler
    server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
        if (request.params.uri === "optical://presets") {
            return {
                contents: [
                    {
                        uri: "optical://presets",
                        mimeType: "application/json",
                        text: (0, presets_1.getPresetsJson)(),
                    },
                ],
            };
        }
        throw new Error(`Resource not found: '${request.params.uri}'`);
    });
    return server;
}
