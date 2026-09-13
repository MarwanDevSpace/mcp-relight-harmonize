# mcp-relight-harmonize

[![npm version](https://img.shields.io/npm/v/mcp-relight-harmonize.svg)](https://www.npmjs.com/package/mcp-relight-harmonize)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/MarwanDevSpace/mcp-relight-harmonize/actions/workflows/ci.yml/badge.svg)](https://github.com/MarwanDevSpace/mcp-relight-harmonize/actions)
[![Glama](https://img.shields.io/badge/Glama-Listed-24b47e.svg)](https://glama.ai/mcp/servers/MarwanDevSpace/mcp-relight-harmonize)

**mcp-relight-harmonize** is an enterprise-grade TypeScript Model Context Protocol (MCP) server and Antigravity Skill engineered by **MarwanDevSpace**. It delivers local optical profiling, physically-grounded relighting variations, contact-aware composite harmonization, and precision prompt synthesis specifically targeting **GPT Image** (DALL-E 3 / GPT-4o) and **Nano Banana**.

---

## Core Capabilities

- **Optical Profiling (`analyze_optical_profile`):**
  - Measures Correlated Color Temperature (CCT in Kelvin) via CIE 1931 xy chromaticity and McCamy's formulation.
  - Derives 3D surface normal gradient tensors ($\vec{N}$) and surface roughness index.
  - Computes dominant light vector, azimuth ($0^\circ - 360^\circ$), and elevation ($0^\circ - 90^\circ$).
  - Evaluates photometric luminance dynamic range, specular highlights, and shadow zones.

- **Physical Relighting (`generate_relight_variations`):**
  - **Ambient:** Soft fill light (+0.8 EV), lifted shadows, 5500K neutral daylight calibration.
  - **Dramatic:** Chiaroscuro high-key contrast S-curve, -1.5 EV shadow crush, directional key gradient.
  - **Rim:** Normal curvature edge mask with high-intensity perimeter glow (+1.2 EV).
  - **Mood:** 3200K tungsten amber shift, highlight bloom diffusion, warm atmospheric tone mapping.

- **Composite Harmonization (`harmonize_composite`):**
  - Reinhard color statistics transfer in Ruderman $l\alpha\beta$ decorrelated space.
  - Grounding contact shadow synthesis to anchor the subject to the ground plane.
  - Smooth alpha blend placement eliminating boundary halos.

- **Diffusion Prompt Synthesizer (`synthesize_diffusion_prompt`):**
  - **GPT Image Target:** Formulates natural descriptive studio directives (85mm f/2.0 prime lens, authentic subsurface scattering, photometric falloff, contact shadows).
  - **Nano Banana Target:** Formulates dense, tokenized optical shaders (micro-pores, roughness index, raytraced bounce, ground contact shadow caster, exact light azimuth, CCT).
  - Supplies calibrated generation parameters (denoising strength: `0.35 - 0.45`).

- **MCP Resources (`optical://presets`):**
  - Read-only JSON specification for lighting presets, EV curves, and color temperature benchmarks.

---

## Tool Specification Matrix

| Tool Name | Key Inputs | Outputs |
|---|---|---|
| `analyze_optical_profile` | `image_path: string` | JSON technical report: CCT (Kelvin), light vectors, azimuth/elevation, luminance dynamics, contrast zones. |
| `generate_relight_variations` | `image_path: string`, `target_lighting?: string`, `output_dir?: string` | 4 generated images (Ambient, Dramatic, Rim, Mood) + EV adjustments log. |
| `harmonize_composite` | `foreground_path: string`, `background_path: string`, `blend_mode?: string` | Composited image with harmonized CCT, Reinhard color transfer, and contact shadow. |
| `synthesize_diffusion_prompt` | `image_path: string`, `user_intent?: string`, `target_model?: "gpt_image" \| "nano_banana"` | Enhancement prompt, Relighting prompt, and calibrated generation parameters. |
| `list_cached_variations` | `cache_dir?: string` | Inventory of generated relight variations and composite artifacts in the output cache. |

---

## Installation & Client Configuration

### 1. Build from Source
```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Run quality test suite
npm test

# Health check
npm run verify
```

### 2. Antigravity & MCP Client Setup (`mcp_config.json`)
Add to your client's `mcp_config.json`:

```json
{
  "mcpServers": {
    "mcp-relight-harmonize": {
      "command": "node",
      "args": [
        "c:/Users/DKurdistan/Desktop/mcp-relight-harmonize/dist/index.js"
      ],
      "env": {
        "OUTPUT_CACHE_DIR": "./generated_variations"
      }
    }
  }
}
```

Or via npx when published:
```json
{
  "mcpServers": {
    "mcp-relight-harmonize": {
      "command": "npx",
      "args": ["-y", "mcp-relight-harmonize"]
    }
  }
}
```

### 3. Docker Deployment (Glama Standard)
```bash
# Build image locally
docker build -t mcp-relight-harmonize .

# Run container over stdio
docker run -i --rm mcp-relight-harmonize
```

---

## Architectural Profile
Consult [MASTER.md](./MASTER.md) for the complete persona specification, optical formulations, and system invariants.
