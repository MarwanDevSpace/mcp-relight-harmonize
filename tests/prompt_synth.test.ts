import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import os from "os";
import { createFixtures } from "./fixtures";
import { synthesizeDiffusionPromptImpl } from "../src/domain/prompt_synthesizer";

describe("Prompt Synthesizer (GPT Image & Nano Banana)", () => {
  let fixtures: { bgPath: string; fgPath: string; cardPath: string };

  beforeAll(() => {
    const tmpDir = path.join(os.tmpdir(), "mcp_prompt_tests");
    fixtures = createFixtures(tmpDir);
  });

  it("synthesizes prompts tailored for GPT Image", () => {
    const res = synthesizeDiffusionPromptImpl(fixtures.bgPath, "dramatic warm sunset", "gpt_image");

    expect(res.targetModel).toBe("GPT Image");
    expect(res.enhancementPrompt).toContain("85mm prime lens");
    expect(res.enhancementPrompt).toContain("subsurface scattering");
    expect(res.relightingPrompt).toContain("physically-based contact shadows");
    expect(res.relightingPrompt).toContain("volumetric dust rays");
    expect(res.recommendedParameters.model).toBe("gpt-image-dalle3");
    expect(res.recommendedParameters.denoising_strength).toBe(0.38);
  });

  it("synthesizes prompts tailored for Nano Banana", () => {
    const res = synthesizeDiffusionPromptImpl(fixtures.bgPath, "product catalog", "nano_banana");

    expect(res.targetModel).toBe("Nano Banana");
    expect(res.enhancementPrompt).toContain("raw sensor clarity");
    expect(res.enhancementPrompt).toContain("roughness index");
    expect(res.relightingPrompt).toContain("optics relight");
    expect(res.relightingPrompt).toContain("ground contact shadow");
    expect(res.recommendedParameters.model).toBe("nano-banana-optical-v1");
    expect(res.recommendedParameters.denoising_strength).toBe(0.38);
    expect(res.recommendedParameters.light_azimuth_deg).toBeDefined();
  });
});
