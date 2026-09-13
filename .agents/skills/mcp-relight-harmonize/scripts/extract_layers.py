#!/usr/bin/env python3
"""
MarwanDevSpace Dynamic 6-Layer Optical Decomposition & Physical Extraction
Decomposes input images into 6 physical visual layers:
  1. 01_highlights.png         - طبقة الألوان الفاتحة (Highlights & Specular Glints)
  2. 02_shadows.png            - طبقة الألوان الغامقة (Shadows & Low-Key Density)
  3. 03_ambient_occlusion.png  - طبقة الظل العالي والارتكاز الأرضي (Deep Contact Shadows & Umbra)
  4. 04_edges.png              - طبقة الحواف والتفاصيل المجهرية (Sobel High-Frequency Gradient Contours)
  5. 05_depth_normals.png      - طبقة العمق والمتجهات (3D Normal Vector Field & Light Angle Tensor)
  6. 06_chroma_saturation.png  - طبقة الألوان والتشبع والبكسلات (Chroma & Saturation Distribution)

Generates dynamic, on-demand Layer.md reports and dual-format generative prompts
(Detailed JSON Specification + Accurate General Descriptive Master Prompt)
specifically targeting Universal Image Generator and GEMINI Nano Banana in Antigravity.
"""

import os
import sys
import argparse
import json
from typing import Optional, Dict, Any, List
import numpy as np
from PIL import Image

def calculate_cct(r_mean: float, g_mean: float, b_mean: float) -> float:
    """Calculates Correlated Color Temperature (Kelvin) using CIE 1931 xy and McCamy formulation."""
    r_norm = min(max(r_mean / 255.0, 0.0), 1.0)
    g_norm = min(max(g_mean / 255.0, 0.0), 1.0)
    b_norm = min(max(b_mean / 255.0, 0.0), 1.0)

    # Gamma linearization (sRGB -> linear RGB)
    def to_linear(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r_lin, g_lin, b_lin = to_linear(r_norm), to_linear(g_norm), to_linear(b_norm)

    # sRGB to XYZ matrix transform
    X = r_lin * 0.4124564 + g_lin * 0.3575761 + b_lin * 0.1804375
    Y = r_lin * 0.2126729 + g_lin * 0.7151522 + b_lin * 0.0721750
    Z = r_lin * 0.0193339 + g_lin * 0.1191920 + b_lin * 0.9503041

    total = X + Y + Z
    if total <= 1e-6:
        return 6500.0

    x = X / total
    y = Y / total

    # McCamy formula
    denom = y - 0.1858
    if abs(denom) < 1e-6:
        return 6500.0

    n = (x - 0.3320) / denom
    cct = 449.0 * (n ** 3) + 3525.0 * (n ** 2) + 6823.3 * n + 5520.33
    return float(np.clip(cct, 1500.0, 20000.0))

def build_dynamic_diagnostics(
    cct_kelvin: float,
    azimuth_deg: float,
    elevation_deg: float,
    hl_coverage_pct: float,
    shadow_coverage_pct: float,
    ao_coverage_pct: float,
    mean_gradient: float,
    mean_saturation: float,
    user_intent: Optional[str] = None
) -> Dict[str, Any]:
    """Generates pure optical metrics, dual prompt formats (Detailed JSON + Master Descriptive Prompt)."""
    rounded_cct = round(cct_kelvin)
    rounded_azimuth = round(azimuth_deg)
    rounded_elevation = round(elevation_deg)

    if rounded_cct < 3800:
        thermal_desc = f"{rounded_cct}K (Warm Tungsten/Golden Hour)"
    elif rounded_cct > 6500:
        thermal_desc = f"{rounded_cct}K (Cool Atmospheric Skylight)"
    else:
        thermal_desc = f"{rounded_cct}K (Balanced Daylight)"

    optical_physics = {
        "cctKelvin": rounded_cct,
        "azimuthDeg": rounded_azimuth,
        "elevationDeg": rounded_elevation,
        "hlCoveragePct": round(hl_coverage_pct, 2),
        "shadowCoveragePct": round(shadow_coverage_pct, 2),
        "aoCoveragePct": round(ao_coverage_pct, 2),
        "edgeRoughness": round(mean_gradient, 4),
        "saturationMean": round(mean_saturation, 3),
    }

    intent_clause = f", {user_intent.strip()}" if user_intent else ""

    # 1. Detailed JSON Specification for Image Generator
    detailed_json_spec = {
        "optical_parameters": {
            "color_temperature_kelvin": rounded_cct,
            "lighting_angles": {
                "azimuth_deg": rounded_azimuth,
                "elevation_deg": rounded_elevation,
            },
            "specular_highlight_coverage_pct": round(hl_coverage_pct, 2),
            "shadow_coverage_pct": round(shadow_coverage_pct, 2),
            "contact_ao_coverage_pct": round(ao_coverage_pct, 2),
            "sobel_edge_roughness_index": round(mean_gradient, 4),
            "chroma_saturation_mean": round(mean_saturation, 3),
        },
        "layer_guidance_for_generator": {
            "layer_01_highlights": "Calibrate specular highlights without digital clipping or blown highlights.",
            "layer_02_shadows": "Maintain shadow depth with natural photometric roll-off and low-key contrast balance.",
            "layer_03_ambient_occlusion": "Anchor the subject firmly to the ground plane with contact shadow umbra.",
            "layer_04_edges": "Preserve fine surface micro-relief and crisp material boundaries without artifacts.",
            "layer_05_depth_normals": f"Align surface normal illumination to azimuth {rounded_azimuth}° and elevation {rounded_elevation}°.",
            "layer_06_chroma_saturation": f"Balance color saturation and spectral purity according to {rounded_cct}K lighting.",
        },
        "camera_and_capture": {
            "lens": "85mm prime lens f/2.0",
            "lighting_rig": "Calibrated photometric studio environment",
            "subsurface_scattering": "Authentic physical light diffusion",
        },
        "user_modification": user_intent or "High-fidelity physical harmonization and optical relighting",
    }

    # 2. Master Photorealistic Descriptive Text Prompt
    master_descriptive_prompt = (
        f"A master-quality studio photograph{intent_clause}. Calibrated optical lighting at {rounded_azimuth}° azimuth "
        f"and {rounded_elevation}° elevation, authentic {rounded_cct}K color temperature balance, "
        f"physically-grounded ambient occlusion contact shadows firmly anchoring the base plane, "
        f"crisp micro-surface geometry (Sobel roughness index {round(mean_gradient, 3)}), "
        f"smooth luminance falloff and authentic subsurface scattering, 85mm prime lens f/2.0."
    )

    universal_prompt = master_descriptive_prompt

    nano_banana_prompt = (
        f"optics relight, cct {rounded_cct}K, light vector azimuth {rounded_azimuth} deg elevation {rounded_elevation} deg, "
        f"surface roughness {round(mean_gradient, 4)}, saturation index {round(mean_saturation, 3)}, "
        f"ground contact occlusion caster, volumetric photon bounce, high-key rim highlight accents, "
        f"denoising strength 0.38{intent_clause}"
    )

    # Concise physical observations
    findings = [
        f"حرارة الألوان المقاسة: {rounded_cct}K ({thermal_desc})",
        f"توجيه الإضاءة الفعلي: زاوية السمت {rounded_azimuth}° | زاوية الارتفاع {rounded_elevation}°",
        f"تغطية الأضواء الساطعة (Highlights): {round(hl_coverage_pct, 2)}%",
        f"تغطية الظلال (Shadows): {round(shadow_coverage_pct, 2)}%",
        f"نسبة الارتكاز الأرضي (AO): {round(ao_coverage_pct, 2)}%",
        f"خشونة الحواف المجهرية (Sobel): {round(mean_gradient, 4)}",
        f"متوسط النقاء اللوني (Saturation): {round(mean_saturation, 3)}",
    ]

    tailored_options = (
        [f"تطبيق التعديل المخصص فوراً: \"{user_intent}\" بمطابقة فيزيائية دقيقة عبر Image Generator."]
        if user_intent
        else ["طلب أي تعديل مخصص في الإضاءة أو الطابع البصري لتطبيقه مباشرة عبر Image Generator."]
    )

    return {
        "thermalDescription": thermal_desc,
        "opticalPhysics": optical_physics,
        "detailedJsonSpecification": detailed_json_spec,
        "masterDescriptivePrompt": master_descriptive_prompt,
        "findings": findings,
        "tailoredOptions": tailored_options,
        "universalImagePrompt": universal_prompt,
        "nanoBananaPrompt": nano_banana_prompt,
    }

def extract_layers(image_path: str, output_dir: str = "Layers", user_intent: Optional[str] = None) -> Dict[str, Any]:
    """Decomposes image into 6 layers and builds Layer.md."""
    abs_image_path = os.path.abspath(image_path)
    if not os.path.exists(abs_image_path):
        raise FileNotFoundError(f"Input image not found: {abs_image_path}")

    abs_output_dir = os.path.abspath(output_dir)
    os.makedirs(abs_output_dir, exist_ok=True)

    img = Image.open(abs_image_path).convert("RGB")
    width, height = img.size
    rgb = np.array(img, dtype=np.float32)

    # Luminance computation (ITU-R BT.709)
    lum = 0.2126 * rgb[:, :, 0] + 0.7152 * rgb[:, :, 1] + 0.0722 * rgb[:, :, 2]
    norm_lum = lum / 255.0
    num_pixels = width * height

    # 1. طبقة الألوان الفاتحة (Highlights / Specular Zones)
    hl_mask = np.clip((lum - 140.0) / 100.0, 0.0, 1.0)
    hl_layer = rgb * hl_mask[:, :, np.newaxis]
    hl_coverage_pct = float((np.sum(lum > 170.0) / num_pixels) * 100.0)
    hl_path = os.path.join(abs_output_dir, "01_highlights.png")
    Image.fromarray(np.uint8(np.clip(hl_layer, 0, 255))).save(hl_path)

    # 2. طبقة الألوان الغامقة (Shadows / Low-Key Zones)
    shadow_mask = np.clip((95.0 - lum) / 80.0, 0.0, 1.0)
    shadow_layer = rgb * shadow_mask[:, :, np.newaxis]
    shadow_coverage_pct = float((np.sum(lum < 85.0) / num_pixels) * 100.0)
    shadow_path = os.path.join(abs_output_dir, "02_shadows.png")
    Image.fromarray(np.uint8(np.clip(shadow_layer, 0, 255))).save(shadow_path)

    # 3. طبقة الظل العالي (Deep Ambient Occlusion & Contact Umbra)
    ao_mask = np.clip((40.0 - lum) / 40.0, 0.0, 1.0)
    ao_visual = np.zeros((height, width, 3), dtype=np.float32)
    ao_visual[:, :, 0] = (1.0 - ao_mask) * 230.0
    ao_visual[:, :, 1] = (1.0 - ao_mask) * 240.0 + (ao_mask * 15.0)
    ao_visual[:, :, 2] = (1.0 - ao_mask) * 255.0 + (ao_mask * 30.0)
    ao_coverage_pct = float((np.sum(lum < 35.0) / num_pixels) * 100.0)
    ao_path = os.path.join(abs_output_dir, "03_ambient_occlusion.png")
    Image.fromarray(np.uint8(np.clip(ao_visual, 0, 255))).save(ao_path)

    # 4. طبقة الحواف (Sobel Gradient Contours)
    sobel_x = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=np.float32)
    sobel_y = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=np.float32)
    padded_lum = np.pad(norm_lum, 1, mode="edge")
    gx = np.zeros((height, width), dtype=np.float32)
    gy = np.zeros((height, width), dtype=np.float32)
    for i in range(3):
        for j in range(3):
            gx += sobel_x[i, j] * padded_lum[i : i + height, j : j + width]
            gy += sobel_y[i, j] * padded_lum[i : i + height, j : j + width]

    edge_mag = np.sqrt(gx ** 2 + gy ** 2)
    edge_vis = np.clip(edge_mag * 4.0 * 255.0, 0, 255)
    mean_gradient = float(np.mean(edge_mag))
    edge_path = os.path.join(abs_output_dir, "04_edges.png")
    Image.fromarray(np.uint8(edge_vis)).save(edge_path)

    # 5. طبقة العمق (Depth / 3D Normal Vector Field)
    scale = 6.0
    nx = -gx * scale
    ny = -gy * scale
    nz = np.ones((height, width), dtype=np.float32)
    mag = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2) + 1e-7
    nx_norm = nx / mag
    ny_norm = ny / mag
    nz_norm = nz / mag

    normal_rgb = np.zeros((height, width, 3), dtype=np.float32)
    normal_rgb[:, :, 0] = (nx_norm * 0.5 + 0.5) * 255.0
    normal_rgb[:, :, 1] = (ny_norm * 0.5 + 0.5) * 255.0
    normal_rgb[:, :, 2] = (nz_norm * 0.5 + 0.5) * 255.0
    depth_path = os.path.join(abs_output_dir, "05_depth_normals.png")
    Image.fromarray(np.uint8(np.clip(normal_rgb, 0, 255))).save(depth_path)

    lum_excess = np.maximum(lum - np.mean(lum), 0.0) ** 2
    sum_w = np.sum(lum_excess) + 1e-7
    avg_lx = np.sum(nx_norm * lum_excess) / sum_w
    avg_ly = np.sum(ny_norm * lum_excess) / sum_w
    avg_lz = np.sum(nz_norm * lum_excess) / sum_w
    l_mag = np.sqrt(avg_lx**2 + avg_ly**2 + avg_lz**2) + 1e-7
    avg_lx, avg_ly, avg_lz = avg_lx / l_mag, avg_ly / l_mag, avg_lz / l_mag
    azimuth_deg = (np.degrees(np.arctan2(-avg_ly, avg_lx)) + 360.0) % 360.0
    elevation_deg = np.clip(np.degrees(np.arcsin(np.clip(avg_lz, -1.0, 1.0))), 0.0, 90.0)

    # 6. طبقة الألوان والتشبع (Chrominance / Saturation Distribution)
    max_c = np.maximum(np.maximum(rgb[:, :, 0], rgb[:, :, 1]), rgb[:, :, 2])
    min_c = np.minimum(np.minimum(rgb[:, :, 0], rgb[:, :, 1]), rgb[:, :, 2])
    chroma = max_c - min_c
    sat = np.zeros_like(chroma)
    non_zero = max_c > 1e-4
    sat[non_zero] = chroma[non_zero] / max_c[non_zero]

    sat_vis = np.zeros((height, width, 3), dtype=np.float32)
    sat_vis[:, :, 0] = np.clip(sat * 255.0 * 1.5, 0, 255)
    sat_vis[:, :, 1] = np.clip((1.0 - np.abs(sat - 0.5) * 2.0) * 220.0, 0, 255)
    sat_vis[:, :, 2] = np.clip((1.0 - sat) * 200.0, 0, 255)
    mean_saturation = float(np.mean(sat))
    chroma_path = os.path.join(abs_output_dir, "06_chroma_saturation.png")
    Image.fromarray(np.uint8(sat_vis)).save(chroma_path)

    # Correlated Color Temperature
    mean_r = float(np.mean(rgb[:, :, 0]))
    mean_g = float(np.mean(rgb[:, :, 1]))
    mean_b = float(np.mean(rgb[:, :, 2]))
    cct_kelvin = calculate_cct(mean_r, mean_g, mean_b)

    # Build Dynamic Diagnostics based purely on calculated data
    diag = build_dynamic_diagnostics(
        cct_kelvin=cct_kelvin,
        azimuth_deg=azimuth_deg,
        elevation_deg=elevation_deg,
        hl_coverage_pct=hl_coverage_pct,
        shadow_coverage_pct=shadow_coverage_pct,
        ao_coverage_pct=ao_coverage_pct,
        mean_gradient=mean_gradient,
        mean_saturation=mean_saturation,
        user_intent=user_intent
    )

    report = {
        "sourceImage": abs_image_path,
        "layersDirectory": abs_output_dir,
        "dimensions": [width, height],
        "opticalMetrics": {
            "cctKelvin": round(cct_kelvin, 1),
            "dominantLightVector": [round(float(avg_lx), 4), round(float(avg_ly), 4), round(float(avg_lz), 4)],
            "lightingAngles": {
                "azimuthDeg": round(float(azimuth_deg), 1),
                "elevationDeg": round(float(elevation_deg), 1),
            },
            "meanLuminance": round(float(np.mean(lum)), 2),
            "meanSaturation": round(mean_saturation, 3),
            "edgeRoughness": round(mean_gradient, 4),
        },
        "diagnostics": diag,
        "layers": {
            "01_highlights": {
                "file": "01_highlights.png",
                "path": hl_path,
                "description": "طبقة الألوان الفاتحة - High-key Luminance & Specular Zones",
                "coveragePct": round(hl_coverage_pct, 2),
            },
            "02_shadows": {
                "file": "02_shadows.png",
                "path": shadow_path,
                "description": "طبقة الألوان الغامقة - Low-key & Shadow Zones",
                "coveragePct": round(shadow_coverage_pct, 2),
            },
            "03_ambient_occlusion": {
                "file": "03_ambient_occlusion.png",
                "path": ao_path,
                "description": "طبقة الظل العالي - High Contact Shadows & Ground Occlusion",
                "coveragePct": round(ao_coverage_pct, 2),
            },
            "04_edges": {
                "file": "04_edges.png",
                "path": edge_path,
                "description": "طبقة الحواف - Sobel High-Frequency Gradient Contours",
                "meanGradient": round(mean_gradient, 4),
            },
            "05_depth_normals": {
                "file": "05_depth_normals.png",
                "path": depth_path,
                "description": "طبقة العمق - 3D Surface Normal Gradient Field (RGB Tangent Map)",
                "dominantAzimuth": round(float(azimuth_deg), 1),
                "dominantElevation": round(float(elevation_deg), 1),
            },
            "06_chroma_saturation": {
                "file": "06_chroma_saturation.png",
                "path": chroma_path,
                "description": "طبقة الألوان والتشبع والبكسلات - Chrominance & Saturation Distribution",
                "meanSaturation": round(mean_saturation, 3),
            },
        },
    }

    user_intent_header = f"\n**الهدف المخصص المطلوب**: `{user_intent}`\n" if user_intent else ""
    json_spec_formatted = json.dumps(diag["detailedJsonSpecification"], indent=2)

    layer_md_path = os.path.join(abs_output_dir, "Layer.md")
    layer_md_content = f"""# تقرير الفحص البصري وتفكيك الطبقات (Layer.md)
**مصدر الصورة**: `{abs_image_path}`  
**أبعاد الصورة**: `{width}x{height}` بكسل  
**التصنيف الضوئي المقاس**: `{diag['thermalDescription']}`  
**زاوية الإضاءة المسجلة**: سمت `{round(azimuth_deg)}°` | ارتفاع `{round(elevation_deg)}°`{user_intent_header}

---

## 1. فهرس الطبقات التحليلية الست المستخرجة (The 6 Extracted Layers)

| # | اسم الطبقة | الملف المولد | القياس الفيزيائي الدقيق |
|---|---|---|---|
| **1** | **طبقة الألوان الفاتحة (Highlights)** | [`01_highlights.png`](file:///{hl_path.replace(os.sep, '/')}) | تغطية الإضاءة العالية واللمعان: `{round(hl_coverage_pct, 2)}%` |
| **2** | **طبقة الألوان الغامقة (Shadows)** | [`02_shadows.png`](file:///{shadow_path.replace(os.sep, '/')}) | مساحة الظلال والمناطق الداكنة: `{round(shadow_coverage_pct, 2)}%` |
| **3** | **طبقة الظل العالي والارتكاز (Ambient Occlusion)** | [`03_ambient_occlusion.png`](file:///{ao_path.replace(os.sep, '/')}) | كثافة ارتكاز التلامس الأرضي: `{round(ao_coverage_pct, 2)}%` |
| **4** | **طبقة الحواف والتفاصيل (Edges & Contours)** | [`04_edges.png`](file:///{edge_path.replace(os.sep, '/')}) | تباين الحواف المجهرية (سوبل): `{round(mean_gradient, 4)}` |
| **5** | **طبقة العمق والمتجهات (3D Depth Normals)** | [`05_depth_normals.png`](file:///{depth_path.replace(os.sep, '/')}) | توجيه متجهات السطح ثلاثية الأبعاد: سمت `{round(azimuth_deg)}°` |
| **6** | **طبقة الألوان والتشبع (Chroma / Saturation)** | [`06_chroma_saturation.png`](file:///{chroma_path.replace(os.sep, '/')}) | متوسط تشبع ونقاء القنوات اللونية: `{round(mean_saturation, 3)}` |

---

## 2. الإلزامية الصارمة: فحص طبقات Layers/ صورة صورة بالذكاء الاصطناعي
> [!IMPORTANT]
> **يُمنع منعاً باتاً الشروع في توليد الصورة المعدلة (Image Generation) قبل فحص كل صورة من صور مجلد `Layers/` صورة صورة بالرؤية البصرية (Vision Analyze)!**
> 
> يقوم الذكاء الاصطناعي بفحص كل ملف واستخلاص معالمه البصرية الحقيقية دون أي نصوص جاهزة أو مسبقة:
> 1. [`01_highlights.png`](file:///{hl_path.replace(os.sep, '/')}): فحص مناطق الانعكاسات الذروية والتوهج ولمعان الخامات.
> 2. [`02_shadows.png`](file:///{shadow_path.replace(os.sep, '/')}): فحص تدرج الظلال، مستوى الانضغاط، ومناطق العتمة low-key.
> 3. [`03_ambient_occlusion.png`](file:///{ao_path.replace(os.sep, '/')}): فحص خط الارتكاز الأرضي لمنع ظهور العنصر طافياً في الفراغ.
> 4. [`04_edges.png`](file:///{edge_path.replace(os.sep, '/')}): فحص حدة الحدود، التضاريس السطحية، والمسامية الدقيقة.
> 5. [`05_depth_normals.png`](file:///{depth_path.replace(os.sep, '/')}): فحص زاوية سقوط الضوء ثلاثية الأبعاد وتجسم الكتلة.
> 6. [`06_chroma_saturation.png`](file:///{chroma_path.replace(os.sep, '/')}): فحص خريطة التشبع، توازن القنوات، وإزالة أي انحراف لوني شاذ.

---

## 3. صيغتا البرومبت التوليدي للـ Image Generator (Dual Generation Prompts)

### الصيغة الأولى: JSON تفصيلي (Detailed JSON Specification)
```json
{json_spec_formatted}
```

### الصيغة الثانية: وصف عام دقيق (Accurate General Descriptive Master Prompt)
> "{diag['masterDescriptivePrompt']}"

> 💡 **ملاحظة**: يعمل البرومبت بتوافق تام مع **أي Image Generator Model**، ويُفضل ويُوصى بشدة باستخدامه داخل **Google Antigravity** لتطبيق التعديل المباشر عبر أداة `generate_image` ومحرك **GEMINI Nano Banana** دون إنشاء نسخ وسيطة ببايثون!

---

## 4. الخطوة التفاعلية الموجهة للمستخدم

**ماذا تريد من تعديل؟**
💬 *حدد التعديل المطلوب أو الرؤية التي تريد تطبيقها، وسيتم توليدها فوراً وبدقة متناهية عبر Image Generator المباشر مستنداً إلى ما تم تعلمه من طبقات مجلد Layers/!*
"""

    with open(layer_md_path, "w", encoding="utf-8") as f:
        f.write(layer_md_content)

    report["layerMarkdownPath"] = layer_md_path
    return report

def main():
    parser = argparse.ArgumentParser(description="MarwanDevSpace Dynamic 6-Layer Optical Decomposition")
    parser.add_argument("--image", "-i", required=True, help="Path to input image")
    parser.add_argument("--output-dir", "-o", default="Layers", help="Output directory for the 6 layers (default: Layers)")
    parser.add_argument("--intent", "-t", default=None, help="Optional user modification intent to tailor report and prompts")
    parser.add_argument("--json", action="store_true", help="Print JSON report to stdout")
    args = parser.parse_args()

    try:
        report = extract_layers(args.image, args.output_dir, user_intent=args.intent)
        if args.json:
            print(json.dumps(report, indent=2))
        else:
            diag = report["diagnostics"]
            print(f"[MarwanDevSpace] 6 Analytical layers successfully extracted to: {report['layersDirectory']}")
            print(f"[MarwanDevSpace] Dynamic Layer.md report created: {report['layerMarkdownPath']}")
            print(f"\nOptical Profile: {diag['thermalDescription']} | Azimuth: {report['opticalMetrics']['lightingAngles']['azimuthDeg']}°")
            print("\n[Interactive Decision Point]: ماذا تريد من تعديل؟")
            for opt in diag["tailoredOptions"]:
                print(f"  - {opt}")
    except Exception as e:
        print(f"[Error] Failed to extract layers: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
