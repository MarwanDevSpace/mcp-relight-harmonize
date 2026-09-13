#!/usr/bin/env node

/**
 * CLI Pipeline Runner for MarwanDevSpace mcp-relight-harmonize.
 * Executes optical profiling, prompt synthesis (GPT Image / Nano Banana), and optional relighting.
 */

const path = require("path");

// Resolve dist modules
const ROOT_DIR = path.resolve(__dirname, "../../../../");
const { analyzeOpticalProfileTool } = require(path.join(ROOT_DIR, "dist/tools/analyze_optical.js"));
const { synthesizeDiffusionPromptTool } = require(path.join(ROOT_DIR, "dist/tools/synthesize_prompt.js"));
const { generateRelightVariationsTool } = require(path.join(ROOT_DIR, "dist/tools/generate_relight.js"));

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log("Usage: node run_pipeline.js <image_path> [--intent '<text>'] [--model gpt_image|nano_banana] [--relight]");
  process.exit(0);
}

const imagePath = args[0];
let userIntent = "";
let targetModel = "gpt_image";
let relight = false;

for (let i = 1; i < args.length; i++) {
  if (args[i] === "--intent" && args[i + 1]) {
    userIntent = args[++i];
  } else if (args[i] === "--model" && args[i + 1]) {
    targetModel = args[++i];
  } else if (args[i] === "--relight") {
    relight = true;
  }
}

// 1. Analyze
const profileEnv = analyzeOpticalProfileTool(imagePath);
if (profileEnv.status !== "success") {
  console.error(`Error: ${profileEnv.summary}`);
  process.exit(1);
}

// 2. Synthesize Prompts
const promptEnv = synthesizeDiffusionPromptTool(imagePath, userIntent, targetModel);

// 3. Relight (optional)
let relightEnv = null;
if (relight) {
  relightEnv = generateRelightVariationsTool(imagePath, "All");
}

const p = profileEnv.data;
const pr = promptEnv.data;

console.log("=".repeat(72));
console.log(" MARWANDEVSPACE OPTICAL PROFILING & PROMPT SYNTHESIS REPORT");
console.log("=".repeat(72));
console.log(`Image:       ${p.imagePath}`);
console.log(`Dimensions:  ${p.dimensions[0]}x${p.dimensions[1]}`);
console.log(`CCT:         ${p.colorTemperatureKelvin} K`);
console.log(`Light Angle: Azimuth ${p.lightingAngles.azimuthDeg}°, Elevation ${p.lightingAngles.elevationDeg}°`);
console.log(`Contrast:    ${p.luminanceDynamics.contrastRatio}:1`);
console.log("-".repeat(72));
console.log(`TARGET MODEL: ${pr.targetModel.toUpperCase()}`);
console.log("-".repeat(72));
console.log("[ENHANCEMENT PROMPT]");
console.log(pr.enhancementPrompt);
console.log("\n[RELIGHTING PROMPT]");
console.log(pr.relightingPrompt);
console.log("\n[RECOMMENDED PARAMETERS]");
for (const [k, v] of Object.entries(pr.recommendedParameters)) {
  console.log(` - ${k}: ${v}`);
}

if (relightEnv && relightEnv.status === "success") {
  console.log("-".repeat(72));
  console.log("[GENERATED RELIGHT VARIATIONS]");
  for (const v of relightEnv.data.variations) {
    console.log(` - ${v.presetName}: ${v.imagePath}`);
  }
}
console.log("=".repeat(72));
