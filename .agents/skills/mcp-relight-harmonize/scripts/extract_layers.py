#!/usr/bin/env python3
"""
MarwanDevSpace - Dynamic 6-Layer Optical Decomposition & Intelligence Engine (Agent Skill Edition)
Extracts 6 analytical visual layers into Layers/ directory:
  1. 01_highlights.png         - طبقة الألوان الفاتحة (Highlights / Specular Zones)
  2. 02_shadows.png            - طبقة الألوان الغامقة (Shadows / Low-Key Zones)
  3. 03_ambient_occlusion.png  - طبقة الظل العالي (Deep Ambient Occlusion & Ground Contact)
  4. 04_edges.png              - طبقة الحواف (Sobel High-Frequency Contours)
  5. 05_depth_normals.png      - طبقة العمق (3D Surface Normal Gradient Field)
  6. 06_chroma_saturation.png  - طبقة الألوان والتشبع والبكسلات (Chroma & Saturation Distribution)

Generates dynamic, on-demand Layer.md reports and physical generative prompts
specifically targeting GPT Image and Nano Banana without static boilerplate.
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
    r_lin = ((r_norm + 0.055) / 1.055) ** 2.4 if r_norm > 0.04045 else r_norm / 12.92
    g_lin = ((g_norm + 0.055) / 1.055) ** 2.4 if g_norm > 0.04045 else g_norm / 12.92
    b_lin = ((b_norm + 0.055) / 1.055) ** 2.4 if b_norm > 0.04045 else b_norm / 12.92

    # CIE XYZ matrix transformation
    X = 0.4124564 * r_lin + 0.3575761 * g_lin + 0.1804375 * b_lin
    Y = 0.2126729 * r_lin + 0.7151522 * g_lin + 0.0721750 * b_lin
    Z = 0.0193339 * r_lin + 0.1191920 * g_lin + 0.9503041 * b_lin

    total = X + Y + Z
    if total <= 1e-7:
        return 6500.0

    x = X / total
    y = Y / total
    denom = 0.1858 - y
    if abs(denom) < 1e-6:
        denom = 1e-6 if denom >= 0 else -1e-6

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
    """Dynamically analyzes layer metrics to produce targeted findings, customized suggestions, and diffusion prompts."""
    findings: List[str] = []
    tailored_options: List[str] = []

    # 1. Thermal & Chromatic Diagnostics
    if cct_kelvin < 3800:
        thermal_desc = f"طيف لوني دافئ جداً ({round(cct_kelvin)}K - Tungsten/Golden Hour)"
        findings.append(f"🔥 **انحياز طيفي دافئ**: الصورة مسجلة بحرارة `{round(cct_kelvin)}K` مع غلبة للأطياف البرتقالية والصفراء في القنوات اللونية.")
        tailored_options.append(f"موازنة حرارة الألوان من `{round(cct_kelvin)}K` إلى 5500K نهارية محايدة لإزالة المسحة الكهرمانية.")
    elif cct_kelvin > 6500:
        thermal_desc = f"طيف لوني بارد ({round(cct_kelvin)}K - Cool Atmospheric Skylight)"
        findings.append(f"❄️ **انحياز طيفي بارد**: الصورة مسجلة بحرارة `{round(cct_kelvin)}K` مع غلبة للزرقة والارتداد السماوي البارد.")
        tailored_options.append(f"تدفئة المشهد الضوئي برفع حرارة الألوان إلى 3200K (Mood Tungsten) أو 4500K سينمائي.")
    else:
        thermal_desc = f"طيف نهاري متوازن ({round(cct_kelvin)}K - Balanced Daylight)"
        findings.append(f"☀️ **حرارة ألوان متوازنة**: حرارة الألوان عند `{round(cct_kelvin)}K` تماثل الإضاءة الاستوديوية المحايدة.")

    # 2. Lighting Angles & Dynamic Contrast
    light_dir = "يمين" if 0 <= azimuth_deg < 90 or 270 <= azimuth_deg <= 360 else "يسار"
    light_vert = "علوية" if elevation_deg > 50 else "أفقية جانبية"
    findings.append(f"💡 **توجيه الإضاءة الرئيسية**: زاوية السمت `{round(azimuth_deg)}°` (إضاءة من جهة ال{light_dir}) مع زاوية ارتفاع `{round(elevation_deg)}°` ({light_vert}).")

    if shadow_coverage_pct > 35.0 and hl_coverage_pct > 15.0:
        findings.append(f"⚡ **تباين درامي عالي (Chiaroscuro)**: كثافة الظلال `{round(shadow_coverage_pct, 1)}%` مع سعة مناطق ساطعة `{round(hl_coverage_pct, 1)}%` تدل على تباين قوي بين المفتاح الضوئي والملء.")
        tailored_options.append("تنعيم التباين ورفع تفاصيل الظلال المغلقة عبر وضع الإضاءة المحيطية (Ambient Fill +0.8 EV).")
    elif shadow_coverage_pct < 12.0 and hl_coverage_pct < 12.0:
        findings.append("🌫️ **إضاءة منبسطة ناعمة (Flat Diffuse)**: تباين منخفض وغياب للمناطق الساطعة الحادة، ما يعطي مظهراً هادئاً.")
        tailored_options.append("إضافة عمق درامي وزيادة التباين بنمط Chiaroscuro عالي التحديد مع إضاءة اتجاهية بارزة.")

    # 3. Grounding & Ambient Occlusion
    if ao_coverage_pct < 2.0:
        findings.append(f"⚠️ **فقدان الارتكاز الأرضي (Lack of Grounding)**: نسبة الظلال التلامسية العميقة `{round(ao_coverage_pct, 2)}%` تكاد تنعدم، مما قد يظهر العنصر كأنه طافٍ في الفراغ.")
        tailored_options.append(f"بناء وتثبيت ظل تلامسي أرضي فيزيائي (Contact Shadow Footprint) أسفل أدنى نقطة ارتكاز.")
    else:
        findings.append(f"⚓ **ارتكاز أرضي متماسك**: نسبة ظلال التلامس والانغلاق الموضعي `{round(ao_coverage_pct, 1)}%` تؤمن التصاقاً بصرياً طبيعياً بالأرضية.")

    # 4. Surface Micro-textures & Edges
    if mean_gradient > 0.03:
        findings.append(f"🔍 **تفاصيل سطحية دقيقة وحواف حادة**: متوسط تباين سوبل `{round(mean_gradient, 4)}` يشير إلى وفرة في التفاصيل المجهرية والأنسجة السطحية الواضحة.")
    else:
        findings.append(f"🎨 **حواف ناعمة وسطح انسيابي**: متوسط تدرج سوبل `{round(mean_gradient, 4)}` يشير إلى مساحات ناعمة متصلة ومناسبة للتنعيم وإعادة التوزيع.")

    # 5. Chroma / Saturation
    if mean_saturation > 0.40:
        findings.append(f"🌈 **تشبع لوني مكثف**: متوسط التشبع `{round(mean_saturation, 3)}` يظهر كثافة لونية حيوية في البكسلات.")
    else:
        findings.append(f"🔘 **لوحة لونية هادئة أو معتدلة**: متوسط التشبع `{round(mean_saturation, 3)}` يعكس تدرجات رصينة غير مبالغ بها.")

    if user_intent:
        tailored_options.insert(0, f"تطبيق طلبك المخصص فوراً: \"{user_intent}\" بتطابق فيزيائي دقيق مع بيانات الطبقات الست.")
    else:
        tailored_options.append("إعادة إضاءة بنمط هالة الحواف (Rim Light Halo +1.2 EV) لإبراز حدود المجسم وعزله عن الخلفية.")
        tailored_options.append("دمج العنصر في خلفية جديدة مع مطابقة إحصائيات الألوان ودرجة الحرارة وظلال الارتكاز.")

    intent_clause = f", {user_intent}" if user_intent else ""
    gpt_prompt = (
        f"A master-quality studio photograph{intent_clause}, calibrated optical lighting at {round(azimuth_deg)}° azimuth "
        f"and {round(elevation_deg)}° elevation, authentic {round(cct_kelvin)}K color temperature balance, "
        f"physically-grounded ambient occlusion contact shadows firmly anchoring the base plane, "
        f"crisp micro-surface geometry (Sobel roughness index {round(mean_gradient, 3)}), "
        f"smooth luminance falloff and authentic subsurface scattering, 85mm prime lens f/2.0."
    )

    nano_banana_prompt = (
        f"optics relight, cct {round(cct_kelvin)}K, light vector azimuth {round(azimuth_deg)} deg elevation {round(elevation_deg)} deg, "
        f"surface roughness {round(mean_gradient, 4)}, saturation index {round(mean_saturation, 3)}, "
        f"ground contact occlusion caster, volumetric photon bounce, high-key rim highlight accents, "
        f"denoising strength 0.38{intent_clause}"
    )

    return {
        "thermalDescription": thermal_desc,
        "findings": findings,
        "tailoredOptions": tailored_options,
        "gptImagePrompt": gpt_prompt,
        "nanoBananaPrompt": nano_banana_prompt,
    }

def extract_layers(image_path: str, output_dir: str = "Layers", user_intent: Optional[str] = None) -> Dict[str, Any]:
    abs_image_path = os.path.abspath(image_path)
    if not os.path.exists(abs_image_path):
        raise FileNotFoundError(f"Source image not found: {abs_image_path}")

    os.makedirs(output_dir, exist_ok=True)
    abs_output_dir = os.path.abspath(output_dir)

    img = Image.open(abs_image_path).convert("RGB")
    rgb = np.array(img, dtype=np.float32)
    height, width, _ = rgb.shape
    num_pixels = width * height

    lum = 0.2126 * rgb[:, :, 0] + 0.7152 * rgb[:, :, 1] + 0.0722 * rgb[:, :, 2]
    norm_lum = lum / 255.0

    hl_mask = np.clip((lum - 170.0) / 75.0, 0.0, 1.0)
    hl_layer = rgb * hl_mask[:, :, np.newaxis]
    hl_coverage_pct = float((np.sum(lum > 170.0) / num_pixels) * 100.0)
    hl_path = os.path.join(abs_output_dir, "01_highlights.png")
    Image.fromarray(np.uint8(np.clip(hl_layer, 0, 255))).save(hl_path)

    shadow_mask = np.clip((95.0 - lum) / 80.0, 0.0, 1.0)
    shadow_layer = rgb * shadow_mask[:, :, np.newaxis]
    shadow_coverage_pct = float((np.sum(lum < 85.0) / num_pixels) * 100.0)
    shadow_path = os.path.join(abs_output_dir, "02_shadows.png")
    Image.fromarray(np.uint8(np.clip(shadow_layer, 0, 255))).save(shadow_path)

    ao_mask = np.clip((40.0 - lum) / 40.0, 0.0, 1.0)
    ao_visual = np.zeros((height, width, 3), dtype=np.float32)
    ao_visual[:, :, 0] = (1.0 - ao_mask) * 230.0
    ao_visual[:, :, 1] = (1.0 - ao_mask) * 240.0 + (ao_mask * 15.0)
    ao_visual[:, :, 2] = (1.0 - ao_mask) * 255.0 + (ao_mask * 30.0)
    ao_coverage_pct = float((np.sum(lum < 35.0) / num_pixels) * 100.0)
    ao_path = os.path.join(abs_output_dir, "03_ambient_occlusion.png")
    Image.fromarray(np.uint8(np.clip(ao_visual, 0, 255))).save(ao_path)

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

    mean_r = float(np.mean(rgb[:, :, 0]))
    mean_g = float(np.mean(rgb[:, :, 1]))
    mean_b = float(np.mean(rgb[:, :, 2]))
    cct_kelvin = calculate_cct(mean_r, mean_g, mean_b)

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

    findings_rendered = "\n\n".join([f"{item}" for item in diag["findings"]])
    options_rendered = "\n".join([f"- **خيار {idx + 1}**: {opt}" for idx, opt in enumerate(diag["tailoredOptions"])])
    user_intent_header = f"\n**الهدف المخصص المطلوب**: `{user_intent}`\n" if user_intent else ""

    layer_md_path = os.path.join(abs_output_dir, "Layer.md")
    layer_md_content = f"""# تقرير الطبقات التحليلية الست (Layer.md)
**مصدر الصورة**: `{abs_image_path}`  
**أبعاد الصورة**: `{width}x{height}` بكسل  
**التصنيف الضوئي المكتشف**: `{diag['thermalDescription']}`  
**زاوية الإضاءة المسجلة**: سمت `{round(azimuth_deg)}°` | ارتفاع `{round(elevation_deg)}°`{user_intent_header}

---

## 1. فهرس الطبقات التحليلية الست (The 6 Extracted Layers)

| # | اسم الطبقة | الملف المولد | القراءة الفيزيائية المكتشفة |
|---|---|---|---|
| **1** | **طبقة الألوان الفاتحة (Highlights)** | [`01_highlights.png`](file:///{hl_path.replace(os.sep, '/')}) | نسبة تغطية الأضواء الساطعة: `{round(hl_coverage_pct, 2)}%` |
| **2** | **طبقة الألوان الغامقة (Shadows)** | [`02_shadows.png`](file:///{shadow_path.replace(os.sep, '/')}) | مساحة الظلال والمناطق الداكنة: `{round(shadow_coverage_pct, 2)}%` |
| **3** | **طبقة الظل العالي (Ambient Occlusion)** | [`03_ambient_occlusion.png`](file:///{ao_path.replace(os.sep, '/')}) | كثافة الارتكاز الأرضي وظلال التلامس: `{round(ao_coverage_pct, 2)}%` |
| **4** | **طبقة الحواف (Edges & Contours)** | [`04_edges.png`](file:///{edge_path.replace(os.sep, '/')}) | تباين الحواف المجهرية لسوبل: `{round(mean_gradient, 4)}` |
| **5** | **طبقة العمق (3D Depth Normals)** | [`05_depth_normals.png`](file:///{depth_path.replace(os.sep, '/')}) | توجيه التنسور المتجهي ثلاثي الأبعاد: سمت `{round(azimuth_deg)}°` |
| **6** | **طبقة الألوان والتشبع (Chroma / Saturation)** | [`06_chroma_saturation.png`](file:///{chroma_path.replace(os.sep, '/')}) | متوسط تشبع وتوزيع نقاء الألوان: `{round(mean_saturation, 3)}` |

---

## 2. النتائج البصرية الديناميكية المستخلصة من الصورة (Dynamic Findings)

{findings_rendered}

---

## 3. التوجيه التوليدي المخصص (Calibrated Prompts for Generative Engines)

### أ. موجه GPT Image (DALL-E 3 / GPT-4o Vision):
> "{diag['gptImagePrompt']}"

### ب. موجه Nano Banana (High-Density Optical Tokenizer):
> "{diag['nanoBananaPrompt']}"

---

## 4. الخطوة التفاعلية الموجهة بالبيانات (Dynamic Interactive Decision)

**ماذا تريد من تعديل؟**
بناءً على المعطيات الضوئية المكتشفة في هذه الصورة تحديداً، إليك خيارات التعديل المقترحة:

{options_rendered}

💬 *يمكنك أيضاً طلب أي تعديل مخصص بحرية تامة، وسيتم فوراً توليد برومبت دقيق للغاية أو إنشاء الصورة المعدلة بالكامل!*
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
            print("\nKey Dynamic Findings:")
            for f in diag["findings"][:3]:
                print(f"  • {f}")
            print("\n[Interactive Decision Point]: ماذا تريد من تعديل؟")
            for opt in diag["tailoredOptions"]:
                print(f"  - {opt}")
    except Exception as e:
        print(f"[Error] Failed to extract layers: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
