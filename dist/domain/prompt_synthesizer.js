"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synthesizeDiffusionPromptImpl = synthesizeDiffusionPromptImpl;
const optical_analyzer_1 = require("./optical_analyzer");
function synthesizeDiffusionPromptImpl(imagePath, userIntent = "", targetModel = "universal") {
    const profile = (0, optical_analyzer_1.analyzeOpticalProfileImpl)(imagePath);
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
    }
    else if (azimuth >= 135 && azimuth < 225) {
        dirLabel = "strong left directional light";
    }
    else if (azimuth >= 225 && azimuth < 315) {
        dirLabel = "bottom ambient bounce fill";
    }
    // Thermal terminology
    let cctTerm = `${cct}K neutral daylight, balanced color temperature`;
    if (cct < 3800) {
        cctTerm = `${cct}K tungsten warm glow, amber light spill`;
    }
    else if (cct > 6200) {
        cctTerm = `${cct}K cool atmospheric skylight, cyan perimeter bounce`;
    }
    // Contrast & shadow terminology
    let contrastTerm = "soft directional shadows, smooth specular roll-off, 2:1 lighting ratio";
    if (contrast > 15.0) {
        contrastTerm = "deep chiaroscuro shadows, high dynamic range, crisp specular highlights";
    }
    else if (contrast < 5.0) {
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
    // Detailed JSON Specification
    const detailedJsonSpecification = {
        opticalPhysics: {
            cctKelvin: cct,
            lightAzimuthDeg: azimuth,
            lightElevationDeg: elevation,
            contrastRatio: Math.round(contrast * 100) / 100,
            surfaceRoughnessIndex: Math.round(profile.surfaceNormalVariation * 1000) / 1000,
            contactShadowIntensity: contrast > 10 ? 0.75 : 0.45,
        },
        layersAnalysis: {
            highlights: `${profile.contrastZones.specularHighlightsPct.toFixed(1)}% specular highlight distribution, ${contrastTerm}`,
            shadows: `${profile.contrastZones.deepShadowsPct.toFixed(1)}% low-key shadow density, controlled falloff`,
            ambientOcclusion: "contact anchoring line at the lowest ground intersection, eliminates floating appearance",
            edgesAndMicrotexture: `Sobel gradient roughness ${profile.surfaceNormalVariation.toFixed(3)}, crisp micro-relief preservation`,
            depthNormals: `dominant 3D light vector azimuth ${azimuth}° / elevation ${elevation}°, tangent normal vector alignment`,
            chromaSaturation: `${cctTerm}, authentic spectral balance without unnatural color cast`,
        },
        renderingDirectives: {
            cameraLens: "85mm prime lens f/2.0",
            lightingSetup: `Calibrated studio rig: ${dirLabel} with ${cctTerm}`,
            subsurfaceScatter: "Realistic material and skin subsurface light penetration",
            contactShadowGrounding: "Physically-grounded base occlusion footprint",
        },
        userModificationIntent: userIntent || "Physical fidelity relighting and layer harmonization",
    };
    // Master Photorealistic Descriptive Text Prompt
    const masterDescriptivePrompt = `A master-quality studio photograph${cleanIntent}. Calibrated optical lighting at ${azimuth}° azimuth and ${elevation}° elevation, ` +
        `${cctTerm}, ${contrastTerm}. Surface micro-relief preserved with authentic physical roughness (index ${profile.surfaceNormalVariation.toFixed(3)}), ` +
        `deep ambient occlusion contact shadow firmly anchoring the base plane to prevent any floating appearance, ` +
        `subtle rim lighting tracing outer silhouette, smooth photometric luminance falloff, authentic subsurface scattering, ` +
        `captured on 85mm prime lens at f/2.0 with crystal-clear boundary sharpness.`;
    let enhancementPrompt = "";
    let relightingPrompt = "";
    let recommendedParameters = {};
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
    }
    else {
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
        detailedJsonSpecification,
        masterDescriptivePrompt,
        enhancementPrompt,
        relightingPrompt,
        recommendedParameters,
        opticalKeywordsUsed: opticalKeywords,
    };
}
