# MCP Relight & Harmonize Server

A production-grade, highly-deterministic Model Context Protocol (MCP) server engineered for **optical profiling, physical decomposition into 6 visual layers, contact-aware composite harmonization, and dual-format generative prompt synthesis (Detailed JSON + Accurate Master Prompt)**.

> **Model Architecture Note**: Fully compatible with **Any Image Generator Model**, with dedicated targets for **Universal Image Generator** and **GEMINI Nano Banana**.  
> **Environment Recommendation**: **Preferred and optimized for use inside Google Antigravity**, where native direct visual generation (`generate_image`) allows zero-friction, instantaneous application of the learned optical layers!

---

## Architectural Principles & Strict Role Separation

1. **Python Role: Optical Extraction & Layer Decomposition Only**:
   - Python executes **purely deterministic mathematical and optical analysis**.
   - Generates exactly 6 visual decomposition layers into the **`Layers/`** directory.
   - **Directory Invariant**: The server exclusively uses the **`Layers/`** directory. **No `Variations/` or `generated_variations/` directories are ever created.**
   - Python **never** creates the final modified image.

2. **Mandatory Image-by-Image Vision Analysis (Analyze)**:
   - The AI Assistant **must never trigger image generation until it inspects and analyzes the 6 images in `Layers/` image-by-image (`صورة صورة`)**.
   - Zero canned or pre-written text: All observations and insights stem directly from visual inspection of the actual layer images.

3. **Dual-Format Generative Prompts (Two Formats)**:
   - **Format 1: Detailed JSON Specification (`detailedJsonSpecification`)**: Comprehensive structured optical physics (Kelvin, azimuth, elevation, contrast ratio, roughness, contact shadow) and layer-by-layer directives for the generator.
   - **Format 2: Accurate General Descriptive Master Prompt (`masterDescriptivePrompt`)**: Photorealistic studio photographic narrative integrating the user's intent with physical lighting and an 85mm prime lens at f/2.0.

4. **Direct Execution via AI Image Generator**:
   - Once the user answers **"ماذا تريد من تعديل؟"**, the modification is rendered **directly through the Image Generator** (such as `generate_image` / GEMINI Nano Banana in Antigravity).

---

## The 6 Physical Visual Layers (`Layers/`)

| # | Layer Image File | Physical Objective & Inspection Target |
|---|---|---|
| **1** | `01_highlights.png` | **طبقة الألوان الفاتحة**: Isolates specular highlights ($Y > 170/255$). Inspected for glint locations and clipping prevention. |
| **2** | `02_shadows.png` | **طبقة الألوان الغامقة**: Isolates low-key values ($Y < 85/255$). Inspected for shadow density and photometric roll-off. |
| **3** | `03_ambient_occlusion.png` | **طبقة الظل العالي والارتكاز**: Isolates contact umbra ($Y < 35/255$). Inspected to anchor base plane and prevent floating subjects. |
| **4** | `04_edges.png` | **طبقة الحواف والتفاصيل**: Sobel gradient magnitude ($M = \sqrt{G_x^2 + G_y^2}$). Inspected for micro-texture and surface roughness. |
| **5** | `05_depth_normals.png` | **طبقة العمق والمتجهات**: Tangent space normal map ($R=N_x, G=N_y, B=N_z$). Inspected for 3D light vector and volumetric volume. |
| **6** | `06_chroma_saturation.png` | **طبقة الألوان والتشبع**: HSV chroma purity distribution. Inspected for color casts and spectral balance. |

---

## Tool Specification Matrix

| Tool Name | Key Inputs | Outputs |
|---|---|---|
| `analyze_optical_profile` | `image_path: string`, `extract_layers?: boolean`, `layers_dir?: string`, `user_intent?: string` | Mathematical optical metrics, 6 visual layers in `Layers/`, and dynamic `Layer.md`. |
| `synthesize_diffusion_prompt` | `image_path: string`, `user_intent?: string`, `target_model?: "universal" \| "nano_banana"` | **Dual Prompts**: Detailed JSON Specification + Accurate General Descriptive Master Prompt. |
| `generate_relight_variations` | `image_path: string`, `target_lighting?: string`, `output_dir?: string` | Physical relit images saved into `Layers/` (Ambient, Dramatic, Rim, Mood). |
| `harmonize_composite` | `foreground_path: string`, `background_path: string`, `blend_mode?: string` | Composited image with harmonized CCT, Reinhard color transfer, and contact shadow. |
| `list_cached_variations` | `cache_dir?: string` | Inventory of generated layers and artifacts in the `Layers/` directory. |

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
        "OUTPUT_CACHE_DIR": "./Layers"
      }
    }
  }
}
```

Or via npx:
```json
{
  "mcpServers": {
    "mcp-relight-harmonize": {
      "command": "npx",
      "args": ["-y", "mcp-relight-harmonize@latest"]
    }
  }
}
```

### 3. Docker Deployment (Glama Standard)
```bash
# Build image locally
docker build -t mcp-relight-harmonize .

# Run container over stdio
docker run -i --rm -e OUTPUT_CACHE_DIR=/app/Layers mcp-relight-harmonize
```

---

## License

MIT © MarwanDevSpace
