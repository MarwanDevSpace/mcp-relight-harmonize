# Tool Orchestration & Interconnection Standards

This document establishes the chaining rules, digest generation, and data propagation requirements across `mcp-relight-harmonize` operations.

---

## 1. Orchestration Philosophy

Tools in the MarwanDevSpace system are idempotent, composable nodes in an optical pipeline. No tool executes destructive mutations without returning verifiable evidence (hashes, URIs, metrics).

```
Pipeline Stage 1: Assessment
[Input Image] ➔ analyze_optical_profile ➔ { OpticalProfileReport, InputsDigest }
                                                 │
                                                 ├── propagates CCT, azimuth, contrast
                                                 ▼
Pipeline Stage 2: Synthesis / Transformation
Option A: generate_relight_variations ➔ { 4 Variation Files, EV Log, Artifact URIs }
Option B: harmonize_composite         ➔ { Grounded Composite, Shadow Metadata }
                                                 │
                                                 └── provides grounded baseline
                                                 ▼
Pipeline Stage 3: Prompt Conditioning
synthesize_diffusion_prompt ➔ { Enhancement Prompt, Relighting Prompt, Parameters }
```

---

## 2. Evidence Handoff Contract

Every tool output contains an `evidence` object:

```json
{
  "evidence": {
    "inputsDigest": "sha256:7f83b1657ff1",
    "sources": [
      {
        "label": "Source Image",
        "uri": "file:///path/to/source.png"
      }
    ],
    "artifacts": [
      {
        "label": "Ambient Variation",
        "uri": "file:///path/to/cache/source_relight_ambient.png"
      }
    ]
  }
}
```

### Propagation Rules:
1. When calling `generate_relight_variations` or `synthesize_diffusion_prompt` downstream, the client or agent should record the previous tool's `inputsDigest` to preserve execution provenance.
2. In compositing workflows, both `foreground_path` and `background_path` are linked as distinct entries under `evidence.sources`.

---

## 3. Error Recovery & Graceful Degradation

| Failure Mode | Primary Behavior | Fallback Strategy |
|---|---|---|
| **Poisson Cloning Boundary Error** | Exception in `cv2.seamlessClone` | Degrades gracefully to boundary-smoothed `_alpha_blend`. |
| **Monochromatic / Low Contrast Image** | Division by zero in normal computation | Normal vector defaults to neutral overhead $[0, 0, 1]$ ($90^\circ$ elevation). |
| **Non-RGB / Single-Channel Mask** | Missing alpha channel | Synthesizes binary luminance mask via thresholding ($Y < 245$). |
| **Invalid Target Model Name** | Unknown model string | Defaults to `Flux` schema and FlowMatchEuler parameters. |
