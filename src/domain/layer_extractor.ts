import fs from "fs";
import path from "path";
import { readImage, writeImage } from "./image_io";
import { calculateCctFromRgb, computeSurfaceNormalsAndLightVector } from "./optical_analyzer";
import { validateImagePath } from "../core/security";

export interface LayerItem {
  file: string;
  path: string;
  description: string;
  metricLabel: string;
  metricValue: string | number;
}

export interface DynamicDiagnostics {
  thermalDescription: string;
  opticalPhysics: {
    cctKelvin: number;
    azimuthDeg: number;
    elevationDeg: number;
    hlCoveragePct: number;
    shadowCoveragePct: number;
    aoCoveragePct: number;
    edgeRoughness: number;
    saturationMean: number;
  };
  detailedJsonSpecification: Record<string, any>;
  masterDescriptivePrompt: string;
  findings: string[];
  tailoredOptions: string[];
  universalImagePrompt: string;
  nanoBananaPrompt: string;
}

export interface LayerExtractionReport {
  sourceImage: string;
  layersDirectory: string;
  dimensions: [number, number];
  opticalMetrics: {
    cctKelvin: number;
    dominantLightVector: [number, number, number];
    lightingAngles: { azimuthDeg: number; elevationDeg: number };
    meanLuminance: number;
    meanSaturation: number;
    edgeRoughness: number;
  };
  diagnostics: DynamicDiagnostics;
  layers: {
    highlights: LayerItem;
    shadows: LayerItem;
    ambientOcclusion: LayerItem;
    edges: LayerItem;
    depthNormals: LayerItem;
    chromaSaturation: LayerItem;
  };
  layerMarkdownPath: string;
}

export function buildDynamicDiagnostics(
  cctKelvin: number,
  azimuthDeg: number,
  elevationDeg: number,
  hlPct: number,
  shPct: number,
  aoPct: number,
  meanGradient: number,
  meanSaturation: number,
  userIntent?: string
): DynamicDiagnostics {
  const roundedCct = Math.round(cctKelvin);
  const roundedAzimuth = Math.round(azimuthDeg);
  const roundedElevation = Math.round(elevationDeg);

  let thermalDesc = `${roundedCct}K (Balanced Daylight)`;
  if (roundedCct < 3800) {
    thermalDesc = `${roundedCct}K (Warm Tungsten/Golden Hour)`;
  } else if (roundedCct > 6500) {
    thermalDesc = `${roundedCct}K (Cool Skylight)`;
  }

  const opticalPhysics = {
    cctKelvin: roundedCct,
    azimuthDeg: roundedAzimuth,
    elevationDeg: roundedElevation,
    hlCoveragePct: Math.round(hlPct * 100) / 100,
    shadowCoveragePct: Math.round(shPct * 100) / 100,
    aoCoveragePct: Math.round(aoPct * 100) / 100,
    edgeRoughness: Math.round(meanGradient * 10000) / 10000,
    saturationMean: Math.round(meanSaturation * 1000) / 1000,
  };

  const intentClause = userIntent ? `, ${userIntent.trim()}` : "";

  // 1. Detailed JSON Specification for Image Generator
  const detailedJsonSpecification: Record<string, any> = {
    optical_parameters: {
      color_temperature_kelvin: roundedCct,
      lighting_angles: {
        azimuth_deg: roundedAzimuth,
        elevation_deg: roundedElevation,
      },
      specular_highlight_coverage_pct: Math.round(hlPct * 100) / 100,
      shadow_coverage_pct: Math.round(shPct * 100) / 100,
      contact_ao_coverage_pct: Math.round(aoPct * 100) / 100,
      sobel_edge_roughness_index: Math.round(meanGradient * 10000) / 10000,
      chroma_saturation_mean: Math.round(meanSaturation * 1000) / 1000,
    },
    layer_guidance_for_generator: {
      layer_01_highlights: "Calibrate specular highlights without digital clipping or blown highlights.",
      layer_02_shadows: "Maintain shadow depth with natural photometric roll-off and low-key contrast balance.",
      layer_03_ambient_occlusion: "Anchor the subject firmly to the ground plane with contact shadow umbra.",
      layer_04_edges: "Preserve fine surface micro-relief and crisp material boundaries without artifacts.",
      layer_05_depth_normals: `Align surface normal illumination to azimuth ${roundedAzimuth}° and elevation ${roundedElevation}°.`,
      layer_06_chroma_saturation: `Balance color saturation and spectral purity according to ${roundedCct}K lighting.`,
    },
    camera_and_capture: {
      lens: "85mm prime lens f/2.0",
      lighting_rig: "Calibrated photometric studio environment",
      subsurface_scattering: "Authentic physical light diffusion",
    },
    user_modification: userIntent || "High-fidelity physical harmonization and optical relighting",
  };

  // 2. Master Photorealistic Descriptive Text Prompt
  const masterDescriptivePrompt =
    `A master-quality studio photograph${intentClause}. Calibrated optical lighting at ${roundedAzimuth}° azimuth ` +
    `and ${roundedElevation}° elevation, authentic ${roundedCct}K color temperature balance, ` +
    `physically-grounded ambient occlusion contact shadows firmly anchoring the base plane, ` +
    `crisp micro-surface geometry (Sobel roughness index ${meanGradient.toFixed(3)}), ` +
    `smooth luminance falloff and authentic subsurface scattering, 85mm prime lens f/2.0.`;

  const universalPrompt = masterDescriptivePrompt;

  const nanoPrompt =
    `optics relight, cct ${roundedCct}K, light vector azimuth ${roundedAzimuth} deg elevation ${roundedElevation} deg, ` +
    `surface roughness ${meanGradient.toFixed(4)}, saturation index ${meanSaturation.toFixed(3)}, ` +
    `ground contact occlusion caster, volumetric photon bounce, high-key rim highlight accents, ` +
    `denoising strength 0.38${intentClause}`;

  // Concise factual metrics findings (no canned prose)
  const findings: string[] = [
    `حرارة الألوان المقاسة: ${roundedCct}K (${thermalDesc})`,
    `توجيه الإضاءة الفعلي: زاوية السمت ${roundedAzimuth}° | زاوية الارتفاع ${roundedElevation}°`,
    `تغطية الأضواء الساطعة (Highlights): ${hlPct.toFixed(2)}%`,
    `تغطية الظلال (Shadows): ${shPct.toFixed(2)}%`,
    `نسبة الارتكاز الأرضي (AO): ${aoPct.toFixed(2)}%`,
    `خشونة الحواف المجهرية (Sobel): ${meanGradient.toFixed(4)}`,
    `متوسط النقاء اللوني (Saturation): ${meanSaturation.toFixed(3)}`,
  ];

  const tailoredOptions: string[] = userIntent
    ? [`تطبيق التعديل المخصص فوراً: "${userIntent}" بمطابقة فيزيائية دقيقة عبر Image Generator.`]
    : [
        "طلب أي تعديل مخصص في الإضاءة أو الطابع البصري لتطبيقه مباشرة عبر Image Generator.",
      ];

  return {
    thermalDescription: thermalDesc,
    opticalPhysics,
    detailedJsonSpecification,
    masterDescriptivePrompt,
    findings,
    tailoredOptions,
    universalImagePrompt: universalPrompt,
    nanoBananaPrompt: nanoPrompt,
  };
}

export function extractLayersImpl(
  imagePath: string,
  outputDir: string = "Layers",
  userIntent?: string
): LayerExtractionReport {
  const resolvedImagePath = validateImagePath(imagePath);
  const resolvedOutputDir = path.resolve(outputDir);

  if (!fs.existsSync(resolvedOutputDir)) {
    fs.mkdirSync(resolvedOutputDir, { recursive: true });
  }

  const raw = readImage(resolvedImagePath);
  const { width, height, data } = raw;
  const numPixels = width * height;

  const lumArray = new Float32Array(numPixels);
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    sumR += r;
    sumG += g;
    sumB += b;
    lumArray[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const meanR = sumR / numPixels;
  const meanG = sumG / numPixels;
  const meanB = sumB / numPixels;
  const cctKelvin = calculateCctFromRgb(meanR, meanG, meanB);

  // 1. طبقة الألوان الفاتحة (Highlights)
  const hlRaw = { width, height, data: Buffer.alloc(numPixels * 4) };
  let hlCount = 0;
  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const lum = lumArray[i];
    if (lum > 170.0) hlCount++;
    const factor = Math.max(0.0, Math.min(1.0, (lum - 140.0) / 100.0));
    hlRaw.data[idx] = Math.round(data[idx] * factor);
    hlRaw.data[idx + 1] = Math.round(data[idx + 1] * factor);
    hlRaw.data[idx + 2] = Math.round(data[idx + 2] * factor);
    hlRaw.data[idx + 3] = 255;
  }
  const hlPct = (hlCount / numPixels) * 100.0;
  const hlPath = path.join(resolvedOutputDir, "01_highlights.png");
  writeImage(hlPath, hlRaw);

  // 2. طبقة الألوان الغامقة (Shadows)
  const shRaw = { width, height, data: Buffer.alloc(numPixels * 4) };
  let shCount = 0;
  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const lum = lumArray[i];
    if (lum < 85.0) shCount++;
    const factor = Math.max(0.0, Math.min(1.0, (95.0 - lum) / 80.0));
    shRaw.data[idx] = Math.round(data[idx] * factor);
    shRaw.data[idx + 1] = Math.round(data[idx + 1] * factor);
    shRaw.data[idx + 2] = Math.round(data[idx + 2] * factor);
    shRaw.data[idx + 3] = 255;
  }
  const shPct = (shCount / numPixels) * 100.0;
  const shPath = path.join(resolvedOutputDir, "02_shadows.png");
  writeImage(shPath, shRaw);

  // 3. طبقة الظل العالي (Ambient Occlusion)
  const aoRaw = { width, height, data: Buffer.alloc(numPixels * 4) };
  let aoCount = 0;
  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const lum = lumArray[i];
    if (lum < 35.0) aoCount++;
    const aoFactor = Math.max(0.0, Math.min(1.0, (40.0 - lum) / 40.0));
    const inv = 1.0 - aoFactor;
    aoRaw.data[idx] = Math.round(inv * 230.0);
    aoRaw.data[idx + 1] = Math.round(inv * 240.0 + aoFactor * 15.0);
    aoRaw.data[idx + 2] = Math.round(inv * 255.0 + aoFactor * 30.0);
    aoRaw.data[idx + 3] = 255;
  }
  const aoPct = (aoCount / numPixels) * 100.0;
  const aoPath = path.join(resolvedOutputDir, "03_ambient_occlusion.png");
  writeImage(aoPath, aoRaw);

  // 4. طبقة الحواف (Edges & Contours)
  const edRaw = { width, height, data: Buffer.alloc(numPixels * 4) };
  let sumGrad = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        edRaw.data[idx] = 0;
        edRaw.data[idx + 1] = 0;
        edRaw.data[idx + 2] = 0;
        edRaw.data[idx + 3] = 255;
        continue;
      }
      const p00 = lumArray[(y - 1) * width + (x - 1)] / 255.0;
      const p02 = lumArray[(y - 1) * width + (x + 1)] / 255.0;
      const p10 = lumArray[y * width + (x - 1)] / 255.0;
      const p12 = lumArray[y * width + (x + 1)] / 255.0;
      const p20 = lumArray[(y + 1) * width + (x - 1)] / 255.0;
      const p22 = lumArray[(y + 1) * width + (x + 1)] / 255.0;
      const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;

      const p01 = lumArray[(y - 1) * width + x] / 255.0;
      const p21 = lumArray[(y + 1) * width + x] / 255.0;
      const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;

      const mag = Math.sqrt(gx * gx + gy * gy);
      sumGrad += mag;
      const edgeVal = Math.min(255, Math.round(mag * 4.0 * 255.0));
      edRaw.data[idx] = edgeVal;
      edRaw.data[idx + 1] = edgeVal;
      edRaw.data[idx + 2] = edgeVal;
      edRaw.data[idx + 3] = 255;
    }
  }
  const meanEdge = sumGrad / numPixels;
  const edPath = path.join(resolvedOutputDir, "04_edges.png");
  writeImage(edPath, edRaw);

  // 5. طبقة العمق (Depth Normals)
  const normRaw = { width, height, data: Buffer.alloc(numPixels * 4) };
  const scale = 6.0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        normRaw.data[idx] = 128;
        normRaw.data[idx + 1] = 128;
        normRaw.data[idx + 2] = 255;
        normRaw.data[idx + 3] = 255;
        continue;
      }
      const p00 = lumArray[(y - 1) * width + (x - 1)] / 255.0;
      const p02 = lumArray[(y - 1) * width + (x + 1)] / 255.0;
      const p10 = lumArray[y * width + (x - 1)] / 255.0;
      const p12 = lumArray[y * width + (x + 1)] / 255.0;
      const p20 = lumArray[(y + 1) * width + (x - 1)] / 255.0;
      const p22 = lumArray[(y + 1) * width + (x + 1)] / 255.0;
      const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;

      const p01 = lumArray[(y - 1) * width + x] / 255.0;
      const p21 = lumArray[(y + 1) * width + x] / 255.0;
      const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;

      const nx = -gx * scale;
      const ny = -gy * scale;
      const nz = 1.0;
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;

      normRaw.data[idx] = Math.round(((nx / length) * 0.5 + 0.5) * 255.0);
      normRaw.data[idx + 1] = Math.round(((ny / length) * 0.5 + 0.5) * 255.0);
      normRaw.data[idx + 2] = Math.round(((nz / length) * 0.5 + 0.5) * 255.0);
      normRaw.data[idx + 3] = 255;
    }
  }
  const normPath = path.join(resolvedOutputDir, "05_depth_normals.png");
  writeImage(normPath, normRaw);

  const { lightVector, angles, roughness } = computeSurfaceNormalsAndLightVector(lumArray, width, height);

  // 6. طبقة الألوان والتشبع (Chroma / Saturation)
  const chrRaw = { width, height, data: Buffer.alloc(numPixels * 4) };
  let sumSat = 0;
  for (let i = 0; i < numPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const maxVal = Math.max(r, g, b);
    const minVal = Math.min(r, g, b);
    const delta = maxVal - minVal;
    const sat = maxVal > 0 ? delta / maxVal : 0.0;
    sumSat += sat;

    chrRaw.data[idx] = Math.min(255, Math.round(sat * 255.0 * 1.5));
    chrRaw.data[idx + 1] = Math.min(255, Math.round((1.0 - Math.abs(sat - 0.5) * 2.0) * 220.0));
    chrRaw.data[idx + 2] = Math.min(255, Math.round((1.0 - sat) * 200.0));
    chrRaw.data[idx + 3] = 255;
  }
  const meanSaturation = sumSat / numPixels;
  const chrPath = path.join(resolvedOutputDir, "06_chroma_saturation.png");
  writeImage(chrPath, chrRaw);

  const meanLum = lumArray.reduce((acc, v) => acc + v, 0) / numPixels;

  const diagnostics = buildDynamicDiagnostics(
    cctKelvin,
    angles.azimuthDeg,
    angles.elevationDeg,
    hlPct,
    shPct,
    aoPct,
    meanEdge,
    meanSaturation,
    userIntent
  );

  const layerMdPath = path.join(resolvedOutputDir, "Layer.md");
  const toForwardSlash = (p: string) => p.replace(/\\/g, "/");
  const userIntentHeader = userIntent ? `\n**الهدف المخصص المطلوب**: \`${userIntent}\`\n` : "";
  const jsonSpecFormatted = JSON.stringify(diagnostics.detailedJsonSpecification, null, 2);

  const mdContent = `# تقرير الفحص البصري وتفكيك الطبقات (Layer.md)
**مصدر الصورة**: \`${resolvedImagePath}\`  
**أبعاد الصورة**: \`${width}x${height}\` بكسل  
**التصنيف الضوئي المقاس**: \`${diagnostics.thermalDescription}\`  
**زاوية الإضاءة المسجلة**: سمت \`${angles.azimuthDeg}°\` | ارتفاع \`${angles.elevationDeg}°\`${userIntentHeader}

---

## 1. فهرس الطبقات التحليلية الست المستخرجة (The 6 Extracted Layers)

| # | اسم الطبقة | الملف المولد | القياس الفيزيائي الدقيق |
|---|---|---|---|
| **1** | **طبقة الألوان الفاتحة (Highlights)** | [\`01_highlights.png\`](file:///${toForwardSlash(hlPath)}) | تغطية الإضاءة العالية واللمعان: \`${hlPct.toFixed(2)}%\` |
| **2** | **طبقة الألوان الغامقة (Shadows)** | [\`02_shadows.png\`](file:///${toForwardSlash(shPath)}) | مساحة الظلال والمناطق الداكنة: \`${shPct.toFixed(2)}%\` |
| **3** | **طبقة الظل العالي والارتكاز (Ambient Occlusion)** | [\`03_ambient_occlusion.png\`](file:///${toForwardSlash(aoPath)}) | كثافة ارتكاز التلامس الأرضي: \`${aoPct.toFixed(2)}%\` |
| **4** | **طبقة الحواف والتفاصيل (Edges & Contours)** | [\`04_edges.png\`](file:///${toForwardSlash(edPath)}) | تباين الحواف المجهرية (سوبل): \`${meanEdge.toFixed(4)}\` |
| **5** | **طبقة العمق والمتجهات (3D Depth Normals)** | [\`05_depth_normals.png\`](file:///${toForwardSlash(normPath)}) | توجيه متجهات السطح ثلاثية الأبعاد: سمت \`${angles.azimuthDeg}°\` |
| **6** | **طبقة الألوان والتشبع (Chroma / Saturation)** | [\`06_chroma_saturation.png\`](file:///${toForwardSlash(chrPath)}) | متوسط تشبع ونقاء القنوات اللونية: \`${meanSaturation.toFixed(3)}\` |

---

## 2. الإلزامية الصارمة: فحص طبقات Layers/ صورة صورة بالذكاء الاصطناعي
> [!IMPORTANT]
> **يُمنع منعاً باتاً الشروع في توليد الصورة المعدلة (Image Generation) قبل فحص كل صورة من صور مجلد \`Layers/\` صورة صورة بالرؤية البصرية (Vision Analyze)!**
> 
> يقوم الذكاء الاصطناعي بفحص كل ملف واستخلاص معالمه البصرية الحقيقية دون أي نصوص جاهزة أو مسبقة:
> 1. [\`01_highlights.png\`](file:///${toForwardSlash(hlPath)}): فحص مناطق الانعكاسات الذروية والتوهج ولمعان الخامات.
> 2. [\`02_shadows.png\`](file:///${toForwardSlash(shPath)}): فحص تدرج الظلال، مستوى الانضغاط، ومناطق العتمة low-key.
> 3. [\`03_ambient_occlusion.png\`](file:///${toForwardSlash(aoPath)}): فحص خط الارتكاز الأرضي لمنع ظهور العنصر طافياً في الفراغ.
> 4. [\`04_edges.png\`](file:///${toForwardSlash(edPath)}): فحص حدة الحدود، التضاريس السطحية، والمسامية الدقيقة.
> 5. [\`05_depth_normals.png\`](file:///${toForwardSlash(normPath)}): فحص زاوية سقوط الضوء ثلاثية الأبعاد وتجسم الكتلة.
> 6. [\`06_chroma_saturation.png\`](file:///${toForwardSlash(chrPath)}): فحص خريطة التشبع، توازن القنوات، وإزالة أي انحراف لوني شاذ.

---

## 3. صيغتا البرومبت التوليدي للـ Image Generator (Dual Generation Prompts)

### الصيغة الأولى: JSON تفصيلي (Detailed JSON Specification)
\`\`\`json
${jsonSpecFormatted}
\`\`\`

### الصيغة الثانية: وصف عام دقيق (Accurate General Descriptive Master Prompt)
> "${diagnostics.masterDescriptivePrompt}"

> 💡 **ملاحظة**: يعمل البرومبت بتوافق تام مع **أي Image Generator Model**، ويُفضل ويُوصى بشدة باستخدامه داخل **Google Antigravity** لتطبيق التعديل المباشر عبر أداة \`generate_image\` ومحرك **GEMINI Nano Banana** دون إنشاء نسخ وسيطة ببايثون!

---

## 4. الخطوة التفاعلية الموجهة للمستخدم

**ماذا تريد من تعديل؟**
💬 *حدد التعديل المطلوب أو الرؤية التي تريد تطبيقها، وسيتم توليدها فوراً وبدقة متناهية عبر Image Generator المباشر مستنداً إلى ما تم تعلمه من طبقات مجلد Layers/!*
`;

  fs.writeFileSync(layerMdPath, mdContent, "utf-8");

  return {
    sourceImage: resolvedImagePath,
    layersDirectory: resolvedOutputDir,
    dimensions: [width, height],
    opticalMetrics: {
      cctKelvin: Math.round(cctKelvin * 10) / 10,
      dominantLightVector: lightVector,
      lightingAngles: angles,
      meanLuminance: Math.round(meanLum * 100) / 100,
      meanSaturation: Math.round(meanSaturation * 1000) / 1000,
      edgeRoughness: Math.round(roughness * 10000) / 10000,
    },
    diagnostics,
    layers: {
      highlights: {
        file: "01_highlights.png",
        path: hlPath,
        description: "طبقة الألوان الفاتحة - High-key Luminance & Specular Zones",
        metricLabel: "coveragePct",
        metricValue: Math.round(hlPct * 100) / 100,
      },
      shadows: {
        file: "02_shadows.png",
        path: shPath,
        description: "طبقة الألوان الغامقة - Low-key & Shadow Zones",
        metricLabel: "coveragePct",
        metricValue: Math.round(shPct * 100) / 100,
      },
      ambientOcclusion: {
        file: "03_ambient_occlusion.png",
        path: aoPath,
        description: "طبقة الظل العالي - High Contact Shadows & Ground Occlusion",
        metricLabel: "coveragePct",
        metricValue: Math.round(aoPct * 100) / 100,
      },
      edges: {
        file: "04_edges.png",
        path: edPath,
        description: "طبقة الحواف - Sobel High-Frequency Gradient Contours",
        metricLabel: "meanGradient",
        metricValue: Math.round(meanEdge * 10000) / 10000,
      },
      depthNormals: {
        file: "05_depth_normals.png",
        path: normPath,
        description: "طبقة العمق - 3D Surface Normal Gradient Field (RGB Tangent Map)",
        metricLabel: "azimuthDeg",
        metricValue: angles.azimuthDeg,
      },
      chromaSaturation: {
        file: "06_chroma_saturation.png",
        path: chrPath,
        description: "طبقة الألوان والتشبع والبكسلات - Chrominance & Saturation Distribution",
        metricLabel: "meanSaturation",
        metricValue: Math.round(meanSaturation * 1000) / 1000,
      },
    },
    layerMarkdownPath: layerMdPath,
  };
}
