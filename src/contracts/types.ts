export type LightingPreset = "Ambient" | "Dramatic" | "Rim" | "Mood" | "All";

export type BlendMode = "seamless" | "alpha";

export type DiffusionModel = "universal" | "nano_banana";

export interface LuminanceDynamicRange {
  min: number;
  max: number;
  p5: number;
  median: number;
  p95: number;
  contrastRatio: number;
}

export interface ContrastZones {
  specularHighlightsPct: number;
  deepShadowsPct: number;
  midtonesPct: number;
}

export interface LightingAngle {
  azimuthDeg: number;
  elevationDeg: number;
}

export interface OpticalProfileReport {
  imagePath: string;
  dimensions: [number, number];
  colorTemperatureKelvin: number;
  dominantLightDirectionVector: [number, number, number];
  lightingAngles: LightingAngle;
  meanLuminance: number;
  luminanceDynamics: LuminanceDynamicRange;
  contrastZones: ContrastZones;
  surfaceNormalVariation: number;
  opticalProfileSummary: string;
}

export interface RelightVariationItem {
  presetName: string;
  imagePath: string;
  fileSizeBytes: number;
  evShiftStops: number;
  targetCctKelvin: number;
  adjustmentsApplied: string[];
}

export interface RelightVariationsResult {
  originalImage: string;
  outputDir: string;
  variations: RelightVariationItem[];
  totalVariations: number;
}

export interface HarmonizeCompositeResult {
  compositeImagePath: string;
  blendMode: string;
  foregroundPath: string;
  backgroundPath: string;
  backgroundCctKelvin: number;
  luminanceScalingFactor: number;
  contactShadowApplied: boolean;
  details: Record<string, any>;
}

export interface DiffusionPromptResult {
  targetModel: string;
  userIntent: string;
  enhancementPrompt: string;
  relightingPrompt: string;
  recommendedParameters: Record<string, any>;
  opticalKeywordsUsed: string[];
}
