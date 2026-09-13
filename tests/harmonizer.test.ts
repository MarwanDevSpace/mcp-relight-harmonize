import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import os from "os";
import fs from "fs";
import { createFixtures } from "./fixtures";
import { harmonizeCompositeImpl } from "../src/domain/harmonizer";

describe("Harmonizer Engine", () => {
  let fixtures: { bgPath: string; fgPath: string; cardPath: string };
  let outDir: string;

  beforeAll(() => {
    const tmpDir = path.join(os.tmpdir(), "mcp_harmonize_tests");
    fixtures = createFixtures(tmpDir);
    outDir = path.join(tmpDir, "harmonize_out");
  });

  it("harmonizes foreground onto background with contact shadow", () => {
    const outPath = path.join(outDir, "composite_result.png");
    const result = harmonizeCompositeImpl(fixtures.fgPath, fixtures.bgPath, "seamless", outPath);

    expect(fs.existsSync(result.compositeImagePath)).toBe(true);
    expect(result.contactShadowApplied).toBe(true);
    expect(result.backgroundCctKelvin).toBeGreaterThan(1500);
    expect(result.details.outputDimensions).toEqual([400, 300]);
  });
});
