import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import os from "os";
import fs from "fs";
import { createFixtures } from "./fixtures";
import { generateRelightVariationsImpl } from "../src/domain/relighter";

describe("Relighting Engine", () => {
  let fixtures: { bgPath: string; fgPath: string; cardPath: string };
  let outDir: string;

  beforeAll(() => {
    const tmpDir = path.join(os.tmpdir(), "mcp_relight_tests");
    fixtures = createFixtures(tmpDir);
    outDir = path.join(tmpDir, "variations_out");
  });

  it("generates all 4 relit variations with mathematical adjustment logs", () => {
    const result = generateRelightVariationsImpl(fixtures.cardPath, "All", outDir);

    expect(result.totalVariations).toBe(4);
    const names = result.variations.map((v) => v.presetName);
    expect(names).toContain("Ambient");
    expect(names).toContain("Dramatic");
    expect(names).toContain("Rim");
    expect(names).toContain("Mood");

    for (const v of result.variations) {
      expect(fs.existsSync(v.imagePath)).toBe(true);
      expect(v.fileSizeBytes).toBeGreaterThan(0);
      expect(v.adjustmentsApplied.length).toBeGreaterThan(0);
    }
  });

  it("generates a single specified preset", () => {
    const result = generateRelightVariationsImpl(fixtures.cardPath, "Dramatic", outDir);
    expect(result.totalVariations).toBe(1);
    expect(result.variations[0].presetName).toBe("Dramatic");
    expect(result.variations[0].evShiftStops).toBe(-1.5);
  });
});
