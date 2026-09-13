# Image Generator Prompt Engineering Guide: Universal & GEMINI Nano Banana

This document maps physical optical metrics into specialized prompt directives compatible with **Any Image Generator Model**, with specific optimization for **GEMINI Nano Banana** in **Google Antigravity**.

---

## 1. Target Engine Paradigms

| Parameter | Universal Image Generator (Natural Studio) | GEMINI Nano Banana (Optical Shaders) |
|---|---|---|
| **Prompt Paradigm** | Natural language, photographic studio directives | Dense tokenized optical descriptors & shaders |
| **Optics Formulation** | 85mm prime lens f/2.0, authentic falloff | Micro-surface specular roughness, normal angle |
| **Contact Shadows** | "physically-based contact shadows at base" | "ground contact shadow, ambient occlusion caster" |
| **Volumetrics** | "subtle volumetric dust rays in air" | "volumetric raytraced bounce" |
| **Denoising Default** | `0.38` | `0.38` (subtle) to `0.42` (dramatic) |
| **Recommended Environment** | Any diffusion generator | **Google Antigravity (`generate_image`)** |

---

## 2. Universal Image Generator Prompt Architecture

### Enhancement Prompt Template:
```text
A master-quality studio photograph, exquisite micro-surface textures, pores and fine material grain,
subsurface scattering, 85mm prime lens at f/2.0, razor-sharp optical boundary and crystal-clear geometry, [User Intent].
```

### Relighting Prompt Template:
```text
Cinematically relit studio photograph: [Direction] positioned at [Azimuth]° azimuth with [Elevation]° elevation,
[Kelvin]K [Warm/Cool] illumination spill, [Contrast Curve], subtle rim lighting tracing the outer silhouette,
volumetric dust rays visible in the air, physically-based contact shadows naturally anchoring the base to the ground plane,
authentic photometric falloff, [User Intent].
```

---

## 3. GEMINI Nano Banana Prompt Architecture

### Enhancement Prompt Template:
```text
ultra-detailed optical capture, raw sensor clarity, 8k uhd, micro-pores, surface specular roughness index [Roughness],
zero chromatic aberration, pristine alpha edge delineation, [User Intent]
```

### Relighting Prompt Template:
```text
optics relight, [Direction], [CCT Term], [Contrast Term], rim lighting perimeter accent,
volumetric raytraced bounce, physically-grounded ground contact shadow, ambient occlusion caster,
denoising 0.38, light_azimuth_[Azimuth]deg, [User Intent]
```

### Recommended Parameters:
- `model`: `"gemini-nano-banana"`
- `target_environment`: `"Google Antigravity"`
- `denoising_strength`: `0.38`
- `guidance_scale`: `4.5`
- `steps`: `32`
- `light_azimuth_deg`: Azimuth in degrees
- `color_temperature_k`: Kelvin value
