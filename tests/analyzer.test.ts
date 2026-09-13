import { describe, it, expect, beforeAll } from "vitest";
import path from "path";
import os from "os";
import { createFixtures } from "./fixtures";
import {
  calculateCctFromRgb,
  analyzeOpticalProfileImpl,
} from "../src/domain/optical_analyzer";

describe("Optical Analyzer", () => {
  let fixtures: { bgPath: string; fgPath: string; cardPath: string };

  beforeAll(() => {
    const tmpDir = path.join(os.tmpdir(), "mcp_optical_tests");
    fixtures = createFixtures(tmpDir);
  });

  it("calculates warm vs cool color temperatures correctly", () => {
    const cctWarm = calculateCctFromRgb(255, 140, 40);
    expect(cctWarm).toBeLessThan(3500);

    const cctCool = calculateCctFromRgb(100, 160, 255);
    expect(cctCool).toBeGreaterThan(6500);
  });

  it("analyzes optical profile report with physical metrics", () => {
    const report = analyzeOpticalProfileImpl(fixtures.bgPath);

    expect(report.dimensions).toEqual([400, 300]);
    expect(report.colorTemperatureKelvin).toBeGreaterThan(1500);
    expect(report.meanLuminance).toBeGreaterThan(0);
    expect(report.luminanceDynamics.contrastRatio).toBeGreaterThanOrEqual(1.0);
    expect(report.lightingAngles.azimuthDeg).toBeGreaterThanOrEqual(0);
    expect(report.lightingAngles.azimuthDeg).toBeLessThanOrEqual(360);
    expect(report.lightingAngles.elevationDeg).toBeGreaterThanOrEqual(0);
    expect(report.lightingAngles.elevationDeg).toBeLessThanOrEqual(90);
    expect(report.opticalProfileSummary).toContain("400x300");
  });
});
