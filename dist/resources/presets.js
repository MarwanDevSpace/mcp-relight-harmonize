"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIGHTING_PRESETS_REFERENCE = void 0;
exports.getPresetsJson = getPresetsJson;
exports.LIGHTING_PRESETS_REFERENCE = {
    version: "1.0.4",
    target_generators: ["Universal Image Generator", "GEMINI Nano Banana"],
    presets: [
        {
            name: "Ambient",
            cct_kelvin: 5500,
            ev_compensation: "+0.8 stops",
            contrast_curve: "Softened gamma (0.75)",
            use_case: "Even fill light, catalog products, studio e-commerce",
            volumetric_keywords: ["soft wrap-around bounce", "zero harsh shadows", "diffuse daylight fill"],
        },
        {
            name: "Dramatic",
            cct_kelvin: 5800,
            ev_compensation: "-1.5 stops shadow crush",
            contrast_curve: "Steep S-curve, high key",
            use_case: "Cinematic narrative portraits, chiaroscuro styling",
            volumetric_keywords: ["directional key light", "deep penumbra", "high dynamic range speculars"],
        },
        {
            name: "Rim",
            cct_kelvin: 7000,
            ev_compensation: "+1.2 stops edge glow",
            contrast_curve: "High-pass perimeter emphasis",
            use_case: "Hero character separation, silhouette delineation against dark background",
            volumetric_keywords: ["silhouetted perimeter halo", "cool cyan rim accent", "subtle atmospheric haze"],
        },
        {
            name: "Mood",
            cct_kelvin: 3200,
            ev_compensation: "+0.4 stops warm shift",
            contrast_curve: "Highlight bloom diffusion",
            use_case: "Golden hour, sunset warmth, cozy candlelit or tungsten environments",
            volumetric_keywords: ["3200K tungsten amber glow", "crepuscular dust rays", "warm specular bloom"],
        },
    ],
};
function getPresetsJson() {
    return JSON.stringify(exports.LIGHTING_PRESETS_REFERENCE, null, 2);
}
