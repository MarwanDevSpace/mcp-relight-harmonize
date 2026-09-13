---
name: mcp-relight-harmonize
description: >-
  Execute end-to-end optical image profiling, physically-grounded relighting variations, contact-aware composite harmonization,
  and precision diffusion prompt synthesis targeting GPT Image and Nano Banana. Use when inspecting lighting angles or color temperature,
  generating alternative illumination schemes (Ambient, Dramatic, Rim, Mood), blending foreground cutouts into backgrounds,
  or drafting photorealistic prompts.
---

# `mcp-relight-harmonize` Skill Specification

Created by **MarwanDevSpace**, this skill empowers the agent to execute physical lighting analysis, generate relighted variations, perform seamless composite harmonization, and craft production diffusion prompts tailored for **GPT Image** and **Nano Banana**.

---

## 1. When to Activate This Skill

Activate this skill whenever the user asks to:
1. **Analyze an image's lighting:** Determine Correlated Color Temperature (CCT in Kelvin), lighting direction vector, azimuth/elevation angles, contrast ratio, or surface roughness.
2. **Relight an image:** Produce 4 physically-grounded lighting variants (`Ambient`, `Dramatic`, `Rim`, `Mood`).
3. **Composite/Harmonize an image:** Place a cutout foreground onto a background scene, matching ambient color statistics and adding physically grounded contact shadows.
4. **Generate `/prompt` for diffusion:** Create exact physical lighting and detail enhancement prompts for **GPT Image** (DALL-E 3 / GPT-4o) and **Nano Banana** with calibrated denoising strength (`0.35 - 0.45`).

---

## 2. Core Workflows & Execution Procedures

### Workflow A: Optical Profiling
Before modifying or inpainting an image, extract its optical geometry:
1. Call tool `analyze_optical_profile({ image_path: "<path_to_image>" })`.
2. Review the resulting `OpticalProfileReport`:
   - **`colorTemperatureKelvin`**: e.g., 3200K tungsten vs 6500K daylight.
   - **`lightingAngles`**: `azimuthDeg` (horizontal angle) and `elevationDeg` (vertical angle).
   - **`luminanceDynamics.contrastRatio`**: Key-to-fill ratio.
3. Use these physical parameters to inform subsequent relighting or prompt writing.

### Workflow B: Generating 4 Relit Variations
To produce visual lighting alternatives on disk:
1. Call tool `generate_relight_variations({ image_path: "<path_to_image>", target_lighting: "All" })`.
2. The tool produces 4 files in `OUTPUT_CACHE_DIR`:
   - `*_relight_ambient.png` (+0.8 EV, lifted shadows, 5500K neutral daylight).
   - `*_relight_dramatic.png` (-1.5 EV shadow crush, top-left directional chiaroscuro).
   - `*_relight_rim.png` (+1.2 EV high-pass edge halo, cool cyan perimeter).
   - `*_relight_mood.png` (3200K tungsten amber shift, highlight bloom diffusion).
3. Present the resulting artifact paths to the user with their mathematical adjustment logs.

### Workflow C: Composite Harmonization
To blend a subject or product into a new background:
1. Call tool `harmonize_composite({ foreground_path: "<fg>", background_path: "<bg>", blend_mode: "seamless" })`.
2. The engine executes:
   - **Reinhard Color Statistics Transfer:** Normalizes foreground means and deviations to match background in Ruderman $l\alpha\beta$ space.
   - **Contact Shadow Synthesis:** Projects an elliptical Gaussian shadow beneath the subject's lowest contact plane.
   - **Smooth Blending:** Eliminates boundary halo artifacts.
3. Return the composite image file path.

### Workflow D: Diffusion Prompt Synthesis (`/prompt`)
To craft targeted generative prompts:
1. Call tool `synthesize_diffusion_prompt({ image_path: "<path>", user_intent: "<intent>", target_model: "gpt_image" | "nano_banana" })`.
2. Extract the two specialized prompts:
   - **`enhancementPrompt`**: Upgrades micro-surface textures, pore fidelity, lens sharpness, and subsurface scattering.
   - **`relightingPrompt`**: Injects exact lighting angles, Kelvin temperature, volumetric dust rays, and contact shadows.
3. For **GPT Image**: outputs natural descriptive photography directives (85mm f/2.0, physical illumination).
4. For **Nano Banana**: outputs dense optical tokens (roughness index, raytraced bounce, ground contact shadow, azimuth).

---

## 3. Reference Documentation

For in-depth mathematical formulations and model guides:
- [Optical Mathematics & Formulations](./references/optical_math.md)
- [Tool Orchestration & Chaining Standards](./references/tool_orchestration.md)
- [GPT Image & Nano Banana Guide](./references/diffusion_guide.md)

---

## 4. Executable Helper Scripts

- Execute full end-to-end analysis & prompt synthesis from CLI:
  `node .agents/skills/mcp-relight-harmonize/scripts/run_pipeline.js <image_path>`
- Verify server health and tool registration:
  `npm run verify`
