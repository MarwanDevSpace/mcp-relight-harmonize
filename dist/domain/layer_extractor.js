"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDynamicDiagnostics = buildDynamicDiagnostics;
exports.extractLayersImpl = extractLayersImpl;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const image_io_1 = require("./image_io");
const optical_analyzer_1 = require("./optical_analyzer");
const security_1 = require("../core/security");
function buildDynamicDiagnostics(cctKelvin, azimuthDeg, elevationDeg, hlPct, shPct, aoPct, meanGradient, meanSaturation, userIntent) {
    const findings = [];
    const tailoredOptions = [];
    // 1. Thermal & Chromatic Diagnostics
    let thermalDesc = "";
    if (cctKelvin < 3800) {
        thermalDesc = `طيف لوني دافئ جداً (${Math.round(cctKelvin)}K - Tungsten/Golden Hour)`;
        findings.push(`🔥 **انحياز طيفي دافئ**: الصورة مسجلة بحرارة \`${Math.round(cctKelvin)}K\` مع غلبة للأطياف الكهرمانية والبرتقالية في القنوات الضوئية.`);
        tailoredOptions.push(`موازنة حرارة الألوان من \`${Math.round(cctKelvin)}K\` إلى 5500K نهارية محايدة لإزالة المسحة الكهرمانية.`);
    }
    else if (cctKelvin > 6500) {
        thermalDesc = `طيف لوني بارد (${Math.round(cctKelvin)}K - Cool Atmospheric Skylight)`;
        findings.push(`❄️ **انحياز طيفي بارد**: الصورة مسجلة بحرارة \`${Math.round(cctKelvin)}K\` مع غلبة للزرقة والارتداد السماوي البارد.`);
        tailoredOptions.push(`تدفئة المشهد الضوئي برفع حرارة الألوان إلى 3200K (Mood Tungsten) أو 4500K سينمائي.`);
    }
    else {
        thermalDesc = `طيف نهاري متوازن (${Math.round(cctKelvin)}K - Balanced Daylight)`;
        findings.push(`☀️ **حرارة ألوان متوازنة**: حرارة الألوان عند \`${Math.round(cctKelvin)}K\` تماثل الإضاءة الاستوديوية المتوازنة.`);
    }
    // 2. Lighting Direction & Dynamic Contrast
    const lightDir = (azimuthDeg >= 0 && azimuthDeg < 90) || (azimuthDeg >= 270 && azimuthDeg <= 360) ? "يمين" : "يسار";
    const lightVert = elevationDeg > 50 ? "علوية" : "أفقية جانبية";
    findings.push(`💡 **توجيه الإضاءة الرئيسية**: زاوية السمت \`${Math.round(azimuthDeg)}°\` (إضاءة من جهة ال${lightDir}) مع زاوية ارتفاع \`${Math.round(elevationDeg)}°\` (${lightVert}).`);
    if (shPct > 35.0 && hlPct > 15.0) {
        findings.push(`⚡ **تباين درامي عالي (Chiaroscuro)**: كثافة الظلال \`${shPct.toFixed(1)}%\` مع مساحة ساطعة \`${hlPct.toFixed(1)}%\` تدل على تباين قوي بين المفتاح الضوئي والملء.`);
        tailoredOptions.push("تنعيم التباين ورفع تفاصيل الظلال المغلقة عبر وضع الإضاءة المحيطية (Ambient Fill +0.8 EV).");
    }
    else if (shPct < 12.0 && hlPct < 12.0) {
        findings.push("🌫️ **إضاءة منبسطة ناعمة (Flat Diffuse)**: تباين منخفض وغياب للمناطق الساطعة الحادة، ما يعطي مظهراً هادئاً ومنبسطاً.");
        tailoredOptions.push("إضافة عمق درامي وزيادة التباين بنمط Chiaroscuro عالي التحديد مع إضاءة اتجاهية بارزة.");
    }
    // 3. Grounding & Ambient Occlusion
    if (aoPct < 2.0) {
        findings.push(`⚠️ **فقدان الارتكاز الأرضي (Lack of Grounding)**: نسبة الظلال التلامسية العميقة \`${aoPct.toFixed(2)}%\` تكاد تنعدم، مما قد يظهر العنصر كأنه طافٍ في الفراغ.`);
        tailoredOptions.push("بناء وتثبيت ظل تلامسي أرضي فيزيائي (Contact Shadow Footprint) أسفل أدنى نقطة ارتكاز لمنع الظهور الطافي.");
    }
    else {
        findings.push(`⚓ **ارتكاز أرضي متماسك**: نسبة ظلال التلامس والانغلاق الموضعي \`${aoPct.toFixed(1)}%\` تؤمن التصاقاً بصرياً طبيعياً بالأرضية.`);
    }
    // 4. Micro-texture & Edges
    if (meanGradient > 0.03) {
        findings.push(`🔍 **تفاصيل سطحية دقيقة وحواف حادة**: متوسط تباين سوبل \`${meanGradient.toFixed(4)}\` يشير إلى وفرة في التفاصيل المجهرية والأنسجة السطحية الواضحة.`);
    }
    else {
        findings.push(`🎨 **حواف ناعمة وسطح انسيابي**: متوسط تدرج سوبل \`${meanGradient.toFixed(4)}\` يشير إلى مساحات ناعمة متصلة ومناسبة للتنعيم وإعادة التوزيع.`);
    }
    // 5. Chroma / Saturation
    if (meanSaturation > 0.4) {
        findings.push(`🌈 **تشبع لوني مكثف**: متوسط التشبع \`${meanSaturation.toFixed(3)}\` يظهر كثافة لونية حيوية في البكسلات.`);
    }
    else {
        findings.push(`🔘 **لوحة لونية هادئة أو معتدلة**: متوسط التشبع \`${meanSaturation.toFixed(3)}\` يعكس تدرجات رصينة غير مبالغ بها.`);
    }
    // User intent or default options
    if (userIntent) {
        tailoredOptions.unshift(`تطبيق طلبك المخصص فوراً: "${userIntent}" بتطابق فيزيائي دقيق مع بيانات الطبقات الست.`);
    }
    else {
        tailoredOptions.push("إعادة إضاءة بنمط هالة الحواف (Rim Light Halo +1.2 EV) لإبراز حدود المجسم وعزله عن الخلفية.");
        tailoredOptions.push("دمج العنصر في خلفية جديدة مع مطابقة إحصائيات الألوان ودرجة الحرارة وظلال الارتكاز.");
    }
    const intentClause = userIntent ? `, ${userIntent}` : "";
    const gptPrompt = `A master-quality studio photograph${intentClause}, calibrated optical lighting at ${Math.round(azimuthDeg)}° azimuth ` +
        `and ${Math.round(elevationDeg)}° elevation, authentic ${Math.round(cctKelvin)}K color temperature balance, ` +
        `physically-grounded ambient occlusion contact shadows firmly anchoring the base plane, ` +
        `crisp micro-surface geometry (Sobel roughness index ${meanGradient.toFixed(3)}), ` +
        `smooth luminance falloff and authentic subsurface scattering, 85mm prime lens f/2.0.`;
    const nanoPrompt = `optics relight, cct ${Math.round(cctKelvin)}K, light vector azimuth ${Math.round(azimuthDeg)} deg elevation ${Math.round(elevationDeg)} deg, ` +
        `surface roughness ${meanGradient.toFixed(4)}, saturation index ${meanSaturation.toFixed(3)}, ` +
        `ground contact occlusion caster, volumetric photon bounce, high-key rim highlight accents, ` +
        `denoising strength 0.38${intentClause}`;
    return {
        thermalDescription: thermalDesc,
        findings,
        tailoredOptions,
        gptImagePrompt: gptPrompt,
        nanoBananaPrompt: nanoPrompt,
    };
}
function extractLayersImpl(imagePath, outputDir = "Layers", userIntent) {
    const resolvedImagePath = (0, security_1.validateImagePath)(imagePath);
    const resolvedOutputDir = path_1.default.resolve(outputDir);
    if (!fs_1.default.existsSync(resolvedOutputDir)) {
        fs_1.default.mkdirSync(resolvedOutputDir, { recursive: true });
    }
    const raw = (0, image_io_1.readImage)(resolvedImagePath);
    const { width, height, data } = raw;
    const numPixels = width * height;
    const lumArray = new Float32Array(numPixels);
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let sumSat = 0;
    for (let i = 0; i < numPixels; i++) {
        const idx = i * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        sumR += r;
        sumG += g;
        sumB += b;
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        lumArray[i] = lum / 255.0;
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const chroma = maxC - minC;
        const sat = maxC > 0 ? chroma / maxC : 0;
        sumSat += sat;
    }
    const meanR = sumR / numPixels;
    const meanG = sumG / numPixels;
    const meanB = sumB / numPixels;
    const meanLum = 0.2126 * meanR + 0.7152 * meanG + 0.0722 * meanB;
    const meanSaturation = sumSat / numPixels;
    const cctKelvin = (0, optical_analyzer_1.calculateCctFromRgb)(meanR, meanG, meanB);
    const { roughness, lightVector, angles } = (0, optical_analyzer_1.computeSurfaceNormalsAndLightVector)(lumArray, width, height);
    const bufHighlights = Buffer.alloc(numPixels * 4);
    const bufShadows = Buffer.alloc(numPixels * 4);
    const bufAO = Buffer.alloc(numPixels * 4);
    const bufEdges = Buffer.alloc(numPixels * 4);
    const bufNormals = Buffer.alloc(numPixels * 4);
    const bufChroma = Buffer.alloc(numPixels * 4);
    let highlightsCount = 0;
    let shadowsCount = 0;
    let aoCount = 0;
    let edgeSum = 0;
    const scale = 6.0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const pIdx = idx * 4;
            const r = data[pIdx];
            const g = data[pIdx + 1];
            const b = data[pIdx + 2];
            const lum = lumArray[idx] * 255.0;
            // 1. Highlights
            if (lum > 170)
                highlightsCount++;
            const hlMask = Math.min(Math.max((lum - 170.0) / 75.0, 0.0), 1.0);
            bufHighlights[pIdx] = Math.round(r * hlMask);
            bufHighlights[pIdx + 1] = Math.round(g * hlMask);
            bufHighlights[pIdx + 2] = Math.round(b * hlMask);
            bufHighlights[pIdx + 3] = 255;
            // 2. Shadows
            if (lum < 85)
                shadowsCount++;
            const shMask = Math.min(Math.max((95.0 - lum) / 80.0, 0.0), 1.0);
            bufShadows[pIdx] = Math.round(r * shMask);
            bufShadows[pIdx + 1] = Math.round(g * shMask);
            bufShadows[pIdx + 2] = Math.round(b * shMask);
            bufShadows[pIdx + 3] = 255;
            // 3. Deep Ambient Occlusion
            if (lum < 35)
                aoCount++;
            const aoMask = Math.min(Math.max((40.0 - lum) / 40.0, 0.0), 1.0);
            bufAO[pIdx] = Math.round((1.0 - aoMask) * 230.0);
            bufAO[pIdx + 1] = Math.round((1.0 - aoMask) * 240.0 + aoMask * 15.0);
            bufAO[pIdx + 2] = Math.round((1.0 - aoMask) * 255.0 + aoMask * 30.0);
            bufAO[pIdx + 3] = 255;
            // 4. Edges via Sobel
            let gx = 0;
            let gy = 0;
            if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
                gx =
                    -lumArray[(y - 1) * width + (x - 1)] +
                        lumArray[(y - 1) * width + (x + 1)] -
                        2 * lumArray[y * width + (x - 1)] +
                        2 * lumArray[y * width + (x + 1)] -
                        lumArray[(y + 1) * width + (x - 1)] +
                        lumArray[(y + 1) * width + (x + 1)];
                gy =
                    -lumArray[(y - 1) * width + (x - 1)] -
                        2 * lumArray[(y - 1) * width + x] -
                        lumArray[(y - 1) * width + (x + 1)] +
                        lumArray[(y + 1) * width + (x - 1)] +
                        2 * lumArray[(y + 1) * width + x] +
                        lumArray[(y + 1) * width + (x + 1)];
            }
            const edgeMag = Math.sqrt(gx * gx + gy * gy);
            edgeSum += edgeMag;
            const edgeVal = Math.min(Math.round(edgeMag * 4.0 * 255.0), 255);
            bufEdges[pIdx] = edgeVal;
            bufEdges[pIdx + 1] = edgeVal;
            bufEdges[pIdx + 2] = edgeVal;
            bufEdges[pIdx + 3] = 255;
            // 5. Depth Normals
            const nx = -gx * scale;
            const ny = -gy * scale;
            const nz = 1.0;
            const mag = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1e-6;
            const normX = nx / mag;
            const normY = ny / mag;
            const normZ = nz / mag;
            bufNormals[pIdx] = Math.round((normX * 0.5 + 0.5) * 255);
            bufNormals[pIdx + 1] = Math.round((normY * 0.5 + 0.5) * 255);
            bufNormals[pIdx + 2] = Math.round((normZ * 0.5 + 0.5) * 255);
            bufNormals[pIdx + 3] = 255;
            // 6. Chroma / Saturation
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            const chroma = maxC - minC;
            const sat = maxC > 0 ? chroma / maxC : 0;
            bufChroma[pIdx] = Math.min(Math.round(sat * 255.0 * 1.5), 255);
            bufChroma[pIdx + 1] = Math.min(Math.round((1.0 - Math.abs(sat - 0.5) * 2.0) * 220.0), 255);
            bufChroma[pIdx + 2] = Math.min(Math.round((1.0 - sat) * 200.0), 255);
            bufChroma[pIdx + 3] = 255;
        }
    }
    const hlPath = path_1.default.join(resolvedOutputDir, "01_highlights.png");
    const shPath = path_1.default.join(resolvedOutputDir, "02_shadows.png");
    const aoPath = path_1.default.join(resolvedOutputDir, "03_ambient_occlusion.png");
    const edPath = path_1.default.join(resolvedOutputDir, "04_edges.png");
    const normPath = path_1.default.join(resolvedOutputDir, "05_depth_normals.png");
    const chrPath = path_1.default.join(resolvedOutputDir, "06_chroma_saturation.png");
    (0, image_io_1.writeImage)(hlPath, { width, height, data: bufHighlights });
    (0, image_io_1.writeImage)(shPath, { width, height, data: bufShadows });
    (0, image_io_1.writeImage)(aoPath, { width, height, data: bufAO });
    (0, image_io_1.writeImage)(edPath, { width, height, data: bufEdges });
    (0, image_io_1.writeImage)(normPath, { width, height, data: bufNormals });
    (0, image_io_1.writeImage)(chrPath, { width, height, data: bufChroma });
    const hlPct = (highlightsCount / numPixels) * 100.0;
    const shPct = (shadowsCount / numPixels) * 100.0;
    const aoPct = (aoCount / numPixels) * 100.0;
    const meanEdge = edgeSum / numPixels;
    // Build Dynamic Diagnostics
    const diagnostics = buildDynamicDiagnostics(cctKelvin, angles.azimuthDeg, angles.elevationDeg, hlPct, shPct, aoPct, meanEdge, meanSaturation, userIntent);
    const layerMdPath = path_1.default.join(resolvedOutputDir, "Layer.md");
    const toForwardSlash = (p) => p.replace(/\\/g, "/");
    const findingsRendered = diagnostics.findings.join("\n\n");
    const optionsRendered = diagnostics.tailoredOptions.map((opt, idx) => `- **خيار ${idx + 1}**: ${opt}`).join("\n");
    const userIntentHeader = userIntent ? `\n**الهدف المخصص المطلوب**: \`${userIntent}\`\n` : "";
    const mdContent = `# تقرير الطبقات التحليلية الست (Layer.md)
**مصدر الصورة**: \`${resolvedImagePath}\`  
**أبعاد الصورة**: \`${width}x${height}\` بكسل  
**التصنيف الضوئي المكتشف**: \`${diagnostics.thermalDescription}\`  
**زاوية الإضاءة المسجلة**: سمت \`${angles.azimuthDeg}°\` | ارتفاع \`${angles.elevationDeg}°\`${userIntentHeader}

---

## 1. فهرس الطبقات التحليلية الست (The 6 Extracted Layers)

| # | اسم الطبقة | الملف المولد | القراءة الفيزيائية المكتشفة |
|---|---|---|---|
| **1** | **طبقة الألوان الفاتحة (Highlights)** | [\`01_highlights.png\`](file:///${toForwardSlash(hlPath)}) | نسبة تغطية الأضواء الساطعة: \`${hlPct.toFixed(2)}%\` |
| **2** | **طبقة الألوان الغامقة (Shadows)** | [\`02_shadows.png\`](file:///${toForwardSlash(shPath)}) | مساحة الظلال والمناطق الداكنة: \`${shPct.toFixed(2)}%\` |
| **3** | **طبقة الظل العالي (Ambient Occlusion)** | [\`03_ambient_occlusion.png\`](file:///${toForwardSlash(aoPath)}) | كثافة الارتكاز الأرضي وظلال التلامس: \`${aoPct.toFixed(2)}%\` |
| **4** | **طبقة الحواف (Edges & Contours)** | [\`04_edges.png\`](file:///${toForwardSlash(edPath)}) | تباين الحواف المجهرية لسوبل: \`${meanEdge.toFixed(4)}\` |
| **5** | **طبقة العمق (3D Depth Normals)** | [\`05_depth_normals.png\`](file:///${toForwardSlash(normPath)}) | توجيه التنسور المتجهي ثلاثي الأبعاد: سمت \`${angles.azimuthDeg}°\` |
| **6** | **طبقة الألوان والتشبع (Chroma / Saturation)** | [\`06_chroma_saturation.png\`](file:///${toForwardSlash(chrPath)}) | متوسط تشبع وتوزيع نقاء الألوان: \`${meanSaturation.toFixed(3)}\` |

---

## 2. النتائج البصرية الديناميكية المستخلصة من الصورة (Dynamic Findings)

${findingsRendered}

---

## 3. التوجيه التوليدي المخصص (Calibrated Prompts for Generative Engines)

### أ. موجه GPT Image (DALL-E 3 / GPT-4o Vision):
> "${diagnostics.gptImagePrompt}"

### ب. موجه Nano Banana (High-Density Optical Tokenizer):
> "${diagnostics.nanoBananaPrompt}"

---

## 4. الخطوة التفاعلية الموجهة بالبيانات (Dynamic Interactive Decision)

**ماذا تريد من تعديل؟**
بناءً على المعطيات الضوئية المكتشفة في هذه الصورة تحديداً، إليك خيارات التعديل المقترحة:

${optionsRendered}

💬 *يمكنك أيضاً طلب أي تعديل مخصص بحرية تامة، وسيتم فوراً توليد برومبت دقيق للغاية أو إنشاء الصورة المعدلة بالكامل!*
`;
    fs_1.default.writeFileSync(layerMdPath, mdContent, "utf-8");
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
                description: "طبقة الظل العالي - High Contact Shadows & Deep Occlusion Crevices",
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
                metricLabel: "dominantAzimuth",
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
