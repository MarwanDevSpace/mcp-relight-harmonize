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
        version: "1.0.4",
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
                        "surface normal roughness index, and optionally decompose into 6 analytical image layers in Layers/ directory.\n\n" +
                        "• Purpose: Diagnostic optical extraction and 6-layer decomposition (Highlights, Shadows, Ambient Occlusion, Edges, Depth Normals, Chroma/Saturation). " +
                        "Unlike 'generate_relight_variations' which creates artistic relit renders, this tool extracts physical diagnostic metrics and visual analytical decomposition layers.\n" +
                        "• Behavior: Read-only by default; writes 6 analytical layer PNGs and Layer.md to the specified directory when 'extract_layers' is true. Unmetered local execution, zero network egress, zero external auth.\n" +
                        "• When to use: Use as the prerequisite first step to inspect baseline lighting conditions or generate the 6 diagnostic layers into Layers/ before relighting or prompting.\n" +
                        "• When NOT to use: Do NOT use if you need creative relighted styles (use 'generate_relight_variations'), if merging a cutout into a scene " +
                        "(use 'harmonize_composite'), or if you only need generative AI prompt synthesis (use 'synthesize_diffusion_prompt').\n" +
                        "• Alternatives: Use 'generate_relight_variations' for creative lighting styles, or 'synthesize_diffusion_prompt' for model prompts.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            image_path: {
                                type: "string",
                                description: "Absolute or workspace-relative path to a local image file (.png, .jpg, or .jpeg). " +
                                    "Must be an existing image under 50 MB.",
                            },
                            extract_layers: {
                                type: "boolean",
                                description: "If true, decomposes image into 6 analytical layers (Highlights, Shadows, Ambient Occlusion, Edges, Depth Normals, Chroma/Saturation) saved to Layers/ directory and generates Layer.md.",
                            },
                            layers_dir: {
                                type: "string",
                                description: "Optional target directory to store the 6 analytical layer images and Layer.md (defaults to 'Layers').",
                            },
                            user_intent: {
                                type: "string",
                                description: "Optional creative or corrective intent to dynamically tailor layer diagnostics, recommendations, and diffusion prompts.",
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
                        "• Alternatives: Use 'synthesize_diffusion_prompt' for your Image Generator (GEMINI Nano Banana / Universal), or 'list_cached_variations' to browse existing outputs.",
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
                        "compatible with Any Image Generator Model (optimized for GEMINI Nano Banana). Outputs photorealistic prompts with physical keywords " +
                        "(exact Kelvin CCT, 3D light angles, volumetric dust rays, contact shadows) and calibrated denoising parameters (0.35 - 0.45).\n\n" +
                        "• Purpose: Generative AI prompt synthesis. Unlike 'generate_relight_variations' which creates image files locally, this tool translates " +
                        "optical geometry into targeted text prompts and hyperparameter sets for Any Image Generator (optimized for Antigravity).\n" +
                        "• Behavior: Completely read-only, deterministic, zero filesystem modifications, no network calls, and no authentication required.\n" +
                        "• When to use: Use when you want to feed photorealistic lighting directives or inpainting prompts into your Image Generator or Antigravity's generate_image.\n" +
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
                                enum: ["universal", "nano_banana"],
                                default: "universal",
                                description: "Target generative engine format: 'universal' (outputs natural descriptive studio directives with 85mm prime lens and physical illumination compatible with Any Image Generator) " +
                                    "or 'nano_banana' (outputs dense tokenized optical shaders for GEMINI Nano Banana). Defaults to 'universal'.",
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
                                    targetModel: { type: "string" },
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
                const extractLayers = Boolean(args.extract_layers);
                const layersDir = args.layers_dir ? String(args.layers_dir) : undefined;
                const userIntent = args.user_intent ? String(args.user_intent) : undefined;
                envelope = (0, analyze_optical_1.analyzeOpticalProfileTool)(imagePath, extractLayers, layersDir, userIntent);
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
                const targetModel = String(args.target_model || "universal");
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
