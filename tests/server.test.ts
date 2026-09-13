import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import os from "os";
import { createFixtures } from "./fixtures";
import { analyzeOpticalProfileTool } from "../src/tools/analyze_optical";
import { generateRelightVariationsTool } from "../src/tools/generate_relight";
import { harmonizeCompositeTool } from "../src/tools/harmonize";
import { synthesizeDiffusionPromptTool } from "../src/tools/synthesize_prompt";
import { listCachedVariationsTool } from "../src/tools/list_cache";
import { getPresetsJson } from "../src/resources/presets";

describe("MCP Server Tool Contracts & Envelopes", () => {
  let fixtures: { bgPath: string; fgPath: string; cardPath: string };

  beforeAll(() => {
    const tmpDir = path.join(os.tmpdir(), "mcp_contract_tests");
    fixtures = createFixtures(tmpDir);
  });

  it("analyze_optical_profile returns standard result envelope", () => {
    const env = analyzeOpticalProfileTool(fixtures.bgPath);

    expect(env.status).toBe("success");
    expect(env.summary).toBeDefined();
    expect(env.data.colorTemperatureKelvin).toBeGreaterThan(1500);
    expect(env.evidence.sources?.length).toBeGreaterThan(0);
    expect(env.nextActions.length).toBeGreaterThan(0);
  });

  it("analyze_optical_profile with extract_layers creates 6 layers and Layer.md", () => {
    const testDir = path.join(os.tmpdir(), "mcp_test_layers");
    const env = analyzeOpticalProfileTool(fixtures.bgPath, true, testDir);

    expect(env.status).toBe("success");
    expect(env.data.layers).toBeDefined();
    expect(env.data.layers.highlights).toBeDefined();
    expect(env.data.layers.shadows).toBeDefined();
    expect(env.data.layers.ambientOcclusion).toBeDefined();
    expect(env.data.layers.edges).toBeDefined();
    expect(env.data.layers.depthNormals).toBeDefined();
    expect(env.data.layers.chromaSaturation).toBeDefined();
    expect(env.evidence.artifacts?.length).toBe(7); // 6 images + Layer.md
  });

  it("returns failed envelope for missing file gracefully", () => {
    const env = analyzeOpticalProfileTool("non_existent_file_123.png");

    expect(env.status).toBe("failed");
    expect(env.data.error_code).toBe("INVALID_PATH");
    expect(env.warnings.length).toBeGreaterThan(0);
  });

  it("generate_relight_variations returns standard envelope with artifacts", () => {
    const env = generateRelightVariationsTool(fixtures.cardPath, "All");

    expect(env.status).toBe("success");
    expect(env.data.totalVariations).toBe(4);
    expect(env.evidence.artifacts?.length).toBe(4);
  });

  it("harmonize_composite returns standard envelope", () => {
    const env = harmonizeCompositeTool(fixtures.fgPath, fixtures.bgPath);

    expect(env.status).toBe("success");
    expect(env.data.contactShadowApplied).toBe(true);
    expect(env.evidence.artifacts?.length).toBe(1);
  });

  it("synthesize_diffusion_prompt returns Universal Image Generator envelope", () => {
    const env = synthesizeDiffusionPromptTool(fixtures.bgPath, "sunset", "universal");

    expect(env.status).toBe("success");
    expect(env.data.targetModel).toBe("Universal Image Generator");
    expect(env.data.enhancementPrompt).toBeDefined();
    expect(env.data.relightingPrompt).toBeDefined();
  });

  it("list_cached_variations lists files in cache directory", () => {
    const env = listCachedVariationsTool();

    expect(env.status).toBe("success");
    expect(env.data.cacheDirectory).toBeDefined();
    expect(Array.isArray(env.data.files)).toBe(true);
  });

  it("optical://presets resource returns valid JSON specification", () => {
    const jsonStr = getPresetsJson();
    const data = JSON.parse(jsonStr);

    expect(data.presets).toBeDefined();
    expect(data.presets.length).toBe(4);
    expect(data.target_generators).toContain("Universal Image Generator");
    expect(data.target_generators).toContain("GEMINI Nano Banana");
  });
});
