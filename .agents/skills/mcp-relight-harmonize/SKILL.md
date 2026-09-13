---
name: mcp-relight-harmonize
description: >-
  Execute end-to-end 6-layer optical image profiling, physically-grounded relighting variations, contact-aware composite harmonization,
  and precision diffusion prompt synthesis compatible with Any Image Generator Model (optimized for GEMINI Nano Banana in Antigravity). Use when inspecting lighting angles or color temperature,
  generating alternative illumination schemes (Ambient, Dramatic, Rim, Mood), blending foreground cutouts into backgrounds,
  or drafting photorealistic prompts.
---

# `mcp-relight-harmonize` Skill Specification

Created by **MarwanDevSpace**, this skill empowers the agent to execute physical lighting analysis, decompose images into 6 visual layers in `Layers/`, generate relighted variations, perform seamless composite harmonization, and craft production diffusion prompts tailored for **Any Image Generator Model** (specifically optimized for **GEMINI Nano Banana** in **Google Antigravity**).

> [!NOTE]
> **Antigravity Recommended**: This skill is optimized to work with **any Image Generator**, and is **strongly preferred inside Google Antigravity** where native desktop image generation (`generate_image`) with **GEMINI Nano Banana** can immediately execute the desired modifications.

---

## 1. When to Activate This Skill

Activate this skill whenever the user asks to:
1. **Decompose & Analyze an image's lighting:** Generate 6 analytical layers into `Layers/` and determine CCT (Kelvin), lighting direction, azimuth/elevation angles, contrast ratio, or surface roughness.
2. **Relight an image:** Produce physically-grounded lighting variants (`Ambient`, `Dramatic`, `Rim`, `Mood`).
3. **Composite/Harmonize an image:** Place a cutout foreground onto a background scene, matching ambient color statistics and adding physically grounded contact shadows.
4. **Generate `/prompt` for diffusion:** Create exact physical lighting and detail enhancement prompts for **Any Image Generator** / **GEMINI Nano Banana** with calibrated denoising strength (`0.35 - 0.45`).

---

## 2. Core Workflows & Execution Procedures

### Workflow A: Optical Profiling & 6-Layer Decomposition
Before modifying or inpainting an image, extract its optical geometry:
1. Call tool `analyze_optical_profile({ image_path: "<path_to_image>", extract_layers: true })` or run:
   `python scripts/extract_layers.py --image <path> [--intent "<intent>"]`
2. Python decomposes the image into 6 visual layers inside `Layers/`:
   - `01_highlights.png` (Highlights / Specular Zones)
   - `02_shadows.png` (Shadows / Low-Key Zones)
   - `03_ambient_occlusion.png` (Deep Ambient Occlusion & Ground Contact)
   - `04_edges.png` (Sobel High-Frequency Contours)
   - `05_depth_normals.png` (3D Surface Normal Gradient Field)
   - `06_chroma_saturation.png` (Chrominance & Saturation Distribution)
3. Review the resulting `OpticalProfileReport` and dynamic `Layer.md`:
   - **`colorTemperatureKelvin`**: e.g., 3200K tungsten vs 5500K daylight.
   - **`lightingAngles`**: `azimuthDeg` and `elevationDeg`.
   - **`luminanceDynamics.contrastRatio`**: Key-to-fill ratio.
   - **`aoCoveragePct`**: Contact shadow presence vs floating subject.
4. Store findings in memory / CoT to guide subsequent generation.

### Workflow B: Interactive Decision & Direct Image Generation
1. Address the user with the mandatory prompt:
   **"ماذا تريد من تعديل؟"**
   accompanied by tailored recommendations derived strictly from the image's detected optical profile.
2. Upon user selection or intent:
   - Synthesize the photorealistic prompt for the **Image Generator**.
   - **Inside Google Antigravity**: Directly trigger `generate_image` using the synthesized prompt to produce the modified image on the spot!

### Workflow C: Physical Relighting Variations
To produce visual lighting alternatives on disk:
1. Call tool `generate_relight_variations({ image_path: "<path_to_image>", target_lighting: "All" })`.
2. The tool produces 4 files in `OUTPUT_CACHE_DIR`:
   - `*_relight_ambient.png` (+0.8 EV, lifted shadows, 5500K neutral daylight).
   - `*_relight_dramatic.png` (-1.5 EV shadow crush, top-left directional chiaroscuro).
   - `*_relight_rim.png` (+1.2 EV high-pass edge halo, cool cyan perimeter).
   - `*_relight_mood.png` (3200K tungsten amber shift, highlight bloom diffusion).

### Workflow D: Composite Harmonization
To blend a subject or product into a new background:
1. Call tool `harmonize_composite({ foreground_path: "<fg>", background_path: "<bg>", blend_mode: "seamless" })`.
2. The engine executes Reinhard Color Statistics Transfer in Ruderman $l\alpha\beta$ space, applies Ground Contact Shadows, and smooths boundaries.

### Workflow E: Diffusion Prompt Synthesis (`/prompt`)
To craft targeted generative prompts:
1. Call tool `synthesize_diffusion_prompt({ image_path: "<path>", user_intent: "<intent>", target_model: "universal" | "nano_banana" })`.
2. Extract the specialized prompts:
   - **`enhancementPrompt`**: Micro-surface textures, pore fidelity, lens sharpness, and subsurface scattering.
   - **`relightingPrompt`**: Exact lighting angles, Kelvin temperature, volumetric dust rays, and contact shadows.

### Workflow F: Output Cache Inspection
1. Call tool `list_cached_variations({ cache_dir?: "<path>" })` to inspect generated artifacts.

---

## 3. Reference Documentation

- [Optical Mathematics & Formulations](./references/optical_math.md)
- [Tool Orchestration & Chaining Standards](./references/tool_orchestration.md)
- [Image Generator & GEMINI Nano Banana Guide](./references/diffusion_guide.md)

---

## 4. Executable Helper Scripts

- Execute 6-layer optical extraction:
  `python scripts/extract_layers.py --image <image_path> [--intent "<intent>"]`
- Execute full end-to-end analysis & prompt synthesis from CLI:
  `node .agents/skills/mcp-relight-harmonize/scripts/run_pipeline.js <image_path>`
- Verify server health and tool registration:
  `npm run verify`
