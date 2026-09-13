"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const analyze_optical_1 = require("./tools/analyze_optical");
const generate_relight_1 = require("./tools/generate_relight");
const harmonize_1 = require("./tools/harmonize");
const synthesize_prompt_1 = require("./tools/synthesize_prompt");
const presets_1 = require("./resources/presets");
function createServer() {
    const server = new index_js_1.Server({
        name: "mcp-relight-harmonize",
        version: "1.0.0",
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
                    description: "Extract physical optical metrics from an image: Correlated Color Temperature (CCT in Kelvin), " +
                        "dominant light vectors, azimuth & elevation angles, luminance dynamic range, and surface roughness.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            image_path: {
                                type: "string",
                                description: "Absolute or workspace-relative path to the image file.",
                            },
                        },
                        required: ["image_path"],
                    },
                },
                {
                    name: "generate_relight_variations",
                    description: "Generate 4 physically-grounded relit image variations (Ambient fill, Dramatic chiaroscuro, " +
                        "Rim light halo, Mood golden-hour) and save them to the output cache directory.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            image_path: {
                                type: "string",
                                description: "Path to the source image.",
                            },
                            target_lighting: {
                                type: "string",
                                enum: ["Ambient", "Dramatic", "Rim", "Mood", "All"],
                                default: "All",
                                description: "Lighting preset: 'Ambient', 'Dramatic', 'Rim', 'Mood', or 'All'.",
                            },
                            output_dir: {
                                type: "string",
                                description: "Custom output directory. If omitted, uses default cache directory.",
                            },
                        },
                        required: ["image_path"],
                    },
                },
                {
                    name: "harmonize_composite",
                    description: "Harmonize and composite a foreground element onto a background scene. Applies Reinhard color " +
                        "statistics transfer, matches background color temperature, and synthesizes grounded contact shadows.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            foreground_path: {
                                type: "string",
                                description: "Path to the foreground subject cutout (PNG/JPG).",
                            },
                            background_path: {
                                type: "string",
                                description: "Path to the background environment image.",
                            },
                            blend_mode: {
                                type: "string",
                                enum: ["seamless", "alpha"],
                                default: "seamless",
                                description: "Blending algorithm ('seamless' or 'alpha').",
                            },
                        },
                        required: ["foreground_path", "background_path"],
                    },
                },
                {
                    name: "synthesize_diffusion_prompt",
                    description: "Synthesize precision enhancement and relighting diffusion prompts for GPT Image (DALL-E 3 / GPT-4o) " +
                        "and Nano Banana based on physical optical analysis of an image. Includes exact Kelvin temperature, " +
                        "lighting angles, volumetric rays, contact shadows, and calibrated denoising parameters (0.35 - 0.45).",
                    inputSchema: {
                        type: "object",
                        properties: {
                            image_path: {
                                type: "string",
                                description: "Path to the reference image.",
                            },
                            user_intent: {
                                type: "string",
                                description: "Creative intent (e.g. 'golden sunset', 'studio commercial').",
                            },
                            target_model: {
                                type: "string",
                                enum: ["gpt_image", "nano_banana"],
                                default: "gpt_image",
                                description: "Target engine: 'gpt_image' (GPT Image) or 'nano_banana' (Nano Banana).",
                            },
                        },
                        required: ["image_path"],
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
