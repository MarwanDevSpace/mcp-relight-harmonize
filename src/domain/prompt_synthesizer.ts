import { DiffusionPromptResult } from "../contracts/types";
import { analyzeOpticalProfileImpl } from "./optical_analyzer";

export function synthesizeDiffusionPromptImpl(
  imagePath: string,
  userIntent = "",
  targetModel = "universal"
): DiffusionPromptResult {
  const profile = analyzeOpticalProfileImpl(imagePath);

  const normalizedModel = targetModel.toLowerCase().includes("banana")
    ? "GEMINI Nano Banana"
    : "Universal Image Generator";

  const cct = Math.round(profile.colorTemperatureKelvin);
  const azimuth = profile.lightingAngles.azimuthDeg;
  const elevation = profile.lightingAngles.elevationDeg;
  const contrast = profile.luminanceDynamics.contrastRatio;

  // Directional terminology
  let dirLabel = "right grazing key light";
  if (azimuth >= 45 && azimuth < 135) {
    dirLabel = "top overhead key light";
  } else if (azimuth >= 135 && azimuth < 225) {
    dirLabel = "strong left directional light";
  } else if (azimuth >= 225 && azimuth < 315) {
    dirLabel = "bottom ambient bounce fill";
  }

  // Thermal terminology
  let cctTerm = `${cct}K neutral daylight, balanced color temperature`;
  if (cct < 3800) {
    cctTerm = `${cct}K tungsten warm glow, amber light spill`;
  } else if (cct > 6200) {
    cctTerm = `${cct}K cool atmospheric skylight, cyan perimeter bounce`;
  }

  // Contrast & shadow terminology
  let contrastTerm = "soft directional shadows, smooth specular roll-off, 2:1 lighting ratio";
  if (contrast > 15.0) {
    contrastTerm = "deep chiaroscuro shadows, high dynamic range, crisp specular highlights";
  } else if (contrast < 5.0) {
    contrastTerm = "diffuse ambient fill, low contrast, wrap-around softbox lighting";
  }

  const opticalKeywords = [
    dirLabel,
    cctTerm,
    contrastTerm,
    "physically-based contact shadows",
    "rim lighting",
    "volumetric dust rays",
    "specular highlight roll-off",
    "subsurface scattering",
  ];

  const cleanIntent = userIntent.trim() ? `, ${userIntent.trim()}` : "";

  let enhancementPrompt = "";
  let relightingPrompt = "";
  let recommendedParameters: Record<string, any> = {};

  if (normalizedModel === "Universal Image Generator") {
    enhancementPrompt =
      `A master-quality studio photograph, exquisite micro-surface textures, pores and fine material grain, ` +
      `subsurface scattering, 85mm prime lens at f/2.0, razor-sharp optical boundary and crystal-clear geometry${cleanIntent}.`;

    relightingPrompt =
      `Cinematically relit studio photograph: ${dirLabel} positioned at ${azimuth}° azimuth with ${elevation}° elevation, ` +
      `${cctTerm}, ${contrastTerm}, subtle rim lighting tracing the outer silhouette, volumetric dust rays visible in the air, ` +
      `physically-based contact shadows naturally anchoring the base to the ground plane, authentic photometric falloff${cleanIntent}.`;

    recommendedParameters = {
      model: "universal-image-generator",
      style: "natural",
      quality: "hd",
      camera_lens: "85mm prime f/2.0",
      denoising_strength: 0.38,
      recommended_dimensions: `${profile.dimensions[0]}x${profile.dimensions[1]}`,
      compatibility: "Works with any Image Generator Model; optimized for Antigravity",
    };
  } else {
    // GEMINI Nano Banana Target
    enhancementPrompt =
      `ultra-detailed optical capture, raw sensor clarity, 8k uhd, micro-pores, surface specular roughness index ${profile.surfaceNormalVariation.toFixed(3)}, ` +
      `zero chromatic aberration, pristine alpha edge delineation${cleanIntent}`;

    relightingPrompt =
      `optics relight, ${dirLabel}, ${cctTerm}, ${contrastTerm}, rim lighting perimeter accent, ` +
      `volumetric raytraced bounce, physically-grounded ground contact shadow, ambient occlusion caster, ` +
      `denoising 0.38, light_azimuth_${Math.round(azimuth)}deg${cleanIntent}`;

    recommendedParameters = {
      model: "gemini-nano-banana",
      target_environment: "Google Antigravity",
      denoising_strength: 0.38,
      guidance_scale: 4.5,
      steps: 32,
      light_azimuth_deg: azimuth,
      light_elevation_deg: elevation,
      color_temperature_k: cct,
      contact_shadow_intensity: 0.55,
    };
  }

  return {
    targetModel: normalizedModel,
    userIntent,
    enhancementPrompt,
    relightingPrompt,
    recommendedParameters,
    opticalKeywordsUsed: opticalKeywords,
  };
}
