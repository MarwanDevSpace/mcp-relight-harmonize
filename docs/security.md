# Security & Trust Boundaries: `mcp-relight-harmonize`

## 1. Threat Model
The server operates locally via `stdio` transport. Although executed within the host environment, it implements proactive defenses against malicious or unverified inputs.

| Threat | Risk | Mitigation |
|---|---|---|
| **Path Traversal (`../..`)** | Unauthorized file disclosure | `validate_and_resolve_path()` canonicalizes paths with `Path.resolve()` and checks boundaries. |
| **Unsupported / Malicious Files** | Parsing bugs or remote code execution | Strict extension allowlist (`.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`, `.tiff`) and image header validation. |
| **Denial of Service (Decompression Bombs)** | Memory exhaustion | File size cap (`MAX_FILE_SIZE_BYTES = 50 MB`) and dimension validation prior to processing. |
| **Secret Leakage** | Exposure of private paths / tokens | Standard error envelopes redact raw system internals, returning normalized error codes and actionable hints. |

## 2. Destructive Operations
- `analyze_optical_profile`: Read-only.
- `synthesize_diffusion_prompt`: Read-only / pure computation.
- `generate_relight_variations`: Writes variation images to designated output directory (`OUTPUT_CACHE_DIR`).
- `harmonize_composite`: Writes composited image to designated output directory.
