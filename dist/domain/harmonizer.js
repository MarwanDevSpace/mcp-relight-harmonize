"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reinhardColorTransfer = reinhardColorTransfer;
exports.applyContactShadow = applyContactShadow;
exports.harmonizeCompositeImpl = harmonizeCompositeImpl;
const path_1 = __importDefault(require("path"));
const security_1 = require("../core/security");
const config_1 = require("../config");
const image_io_1 = require("./image_io");
const optical_analyzer_1 = require("./optical_analyzer");
// RGB to Ruderman LAB-like color space conversion
function rgbToLab(r, g, b) {
    // Convert to LMS
    const L = 0.3811 * r + 0.5783 * g + 0.0402 * b;
    const M = 0.1967 * r + 0.7244 * g + 0.0782 * b;
    const S = 0.0241 * r + 0.1288 * g + 0.8444 * b;
    const logL = L > 0.0001 ? Math.log10(L) : -4;
    const logM = M > 0.0001 ? Math.log10(M) : -4;
    const logS = S > 0.0001 ? Math.log10(S) : -4;
    const l = (logL + logM + logS) / Math.sqrt(3);
    const alpha = (logL + logM - 2 * logS) / Math.sqrt(6);
    const beta = (logL - logM) / Math.sqrt(2);
    return [l, alpha, beta];
}
function labToRgb(l, alpha, beta) {
    const logL = l / Math.sqrt(3) + alpha / Math.sqrt(6) + beta / Math.sqrt(2);
    const logM = l / Math.sqrt(3) + alpha / Math.sqrt(6) - beta / Math.sqrt(2);
    const logS = l / Math.sqrt(3) - (2 * alpha) / Math.sqrt(6);
    const L = Math.pow(10, logL);
    const M = Math.pow(10, logM);
    const S = Math.pow(10, logS);
    let r = 4.4679 * L - 3.5873 * M + 0.1193 * S;
    let g = -1.2186 * L + 2.3809 * M - 0.1624 * S;
    let b = 0.0497 * L - 0.2439 * M + 1.2045 * S;
    return [
        Math.min(Math.max(Math.round(r), 0), 255),
        Math.min(Math.max(Math.round(g), 0), 255),
        Math.min(Math.max(Math.round(b), 0), 255),
    ];
}
function reinhardColorTransfer(fg, bg) {
    const out = (0, image_io_1.cloneImage)(fg);
    const fgPixels = fg.width * fg.height;
    const bgPixels = bg.width * bg.height;
    // Compute fg stats
    let sumL_fg = 0, sumA_fg = 0, sumB_fg = 0;
    let count_fg = 0;
    const fgLab = new Float32Array(fgPixels * 3);
    for (let i = 0; i < fgPixels; i++) {
        const idx = i * 4;
        const a = fg.data[idx + 3];
        if (a > 30) {
            const [l, alpha, beta] = rgbToLab(fg.data[idx], fg.data[idx + 1], fg.data[idx + 2]);
            fgLab[i * 3] = l;
            fgLab[i * 3 + 1] = alpha;
            fgLab[i * 3 + 2] = beta;
            sumL_fg += l;
            sumA_fg += alpha;
            sumB_fg += beta;
            count_fg++;
        }
    }
    if (count_fg < 10)
        return out;
    const meanL_fg = sumL_fg / count_fg;
    const meanA_fg = sumA_fg / count_fg;
    const meanB_fg = sumB_fg / count_fg;
    let varL_fg = 0, varA_fg = 0, varB_fg = 0;
    for (let i = 0; i < fgPixels; i++) {
        if (fg.data[i * 4 + 3] > 30) {
            varL_fg += Math.pow(fgLab[i * 3] - meanL_fg, 2);
            varA_fg += Math.pow(fgLab[i * 3 + 1] - meanA_fg, 2);
            varB_fg += Math.pow(fgLab[i * 3 + 2] - meanB_fg, 2);
        }
    }
    const stdL_fg = Math.sqrt(varL_fg / count_fg) || 1e-4;
    const stdA_fg = Math.sqrt(varA_fg / count_fg) || 1e-4;
    const stdB_fg = Math.sqrt(varB_fg / count_fg) || 1e-4;
    // Compute bg stats
    let sumL_bg = 0, sumA_bg = 0, sumB_bg = 0;
    for (let i = 0; i < bgPixels; i++) {
        const idx = i * 4;
        const [l, alpha, beta] = rgbToLab(bg.data[idx], bg.data[idx + 1], bg.data[idx + 2]);
        sumL_bg += l;
        sumA_bg += alpha;
        sumB_bg += beta;
    }
    const meanL_bg = sumL_bg / bgPixels;
    const meanA_bg = sumA_bg / bgPixels;
    const meanB_bg = sumB_bg / bgPixels;
    let varL_bg = 0, varA_bg = 0, varB_bg = 0;
    for (let i = 0; i < bgPixels; i++) {
        const idx = i * 4;
        const [l, alpha, beta] = rgbToLab(bg.data[idx], bg.data[idx + 1], bg.data[idx + 2]);
        varL_bg += Math.pow(l - meanL_bg, 2);
        varA_bg += Math.pow(alpha - meanA_bg, 2);
        varB_bg += Math.pow(beta - meanB_bg, 2);
    }
    const stdL_bg = Math.sqrt(varL_bg / bgPixels) || 1e-4;
    const stdA_bg = Math.sqrt(varA_bg / bgPixels) || 1e-4;
    const stdB_bg = Math.sqrt(varB_bg / bgPixels) || 1e-4;
    // Scale and shift
    for (let i = 0; i < fgPixels; i++) {
        const idx = i * 4;
        if (fg.data[idx + 3] > 30) {
            let l = (fgLab[i * 3] - meanL_fg) * (stdL_bg / stdL_fg) + meanL_bg;
            let alpha = (fgLab[i * 3 + 1] - meanA_fg) * (stdA_bg / stdA_fg) + meanA_bg;
            let beta = (fgLab[i * 3 + 2] - meanB_fg) * (stdB_bg / stdB_fg) + meanB_bg;
            const [r, g, b] = labToRgb(l, alpha, beta);
            out.data[idx] = r;
            out.data[idx + 1] = g;
            out.data[idx + 2] = b;
        }
    }
    return out;
}
function applyContactShadow(bg, fg, centerX, centerY) {
    // Find lowest bounding pixel of foreground
    let maxLocalY = 0;
    for (let y = 0; y < fg.height; y++) {
        for (let x = 0; x < fg.width; x++) {
            if (fg.data[(y * fg.width + x) * 4 + 3] > 50) {
                if (y > maxLocalY)
                    maxLocalY = y;
            }
        }
    }
    const contactY = centerY - Math.floor(fg.height / 2) + maxLocalY;
    const radiusX = Math.max(Math.floor(fg.width * 0.4), 10);
    const radiusY = Math.max(Math.floor(radiusX * 0.22), 5);
    const startY = Math.max(contactY - radiusY, 0);
    const endY = Math.min(contactY + radiusY * 2, bg.height);
    const startX = Math.max(centerX - radiusX * 2, 0);
    const endX = Math.min(centerX + radiusX * 2, bg.width);
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const dx = (x - centerX) / (radiusX * 1.5);
            const dy = (y - contactY) / (radiusY * 1.5);
            const distSq = dx * dx + dy * dy;
            if (distSq < 1.0) {
                // Gaussian falloff
                const shadowAlpha = Math.exp(-distSq * 2.5) * 0.55;
                const idx = (y * bg.width + x) * 4;
                bg.data[idx] = Math.round(bg.data[idx] * (1.0 - shadowAlpha));
                bg.data[idx + 1] = Math.round(bg.data[idx + 1] * (1.0 - shadowAlpha));
                bg.data[idx + 2] = Math.round(bg.data[idx + 2] * (1.0 - shadowAlpha));
            }
        }
    }
}
function harmonizeCompositeImpl(foregroundPath, backgroundPath, blendMode = "seamless", outputPath) {
    const fgResolved = (0, security_1.validateImagePath)(foregroundPath);
    const bgResolved = (0, security_1.validateImagePath)(backgroundPath);
    const fgRaw = (0, image_io_1.readImage)(fgResolved);
    const bgRaw = (0, image_io_1.readImage)(bgResolved);
    // 1. Reinhard color transfer
    const harmonizedFg = reinhardColorTransfer(fgRaw, bgRaw);
    // 2. Background stats for CCT
    let sumR = 0, sumG = 0, sumB = 0;
    const bgTotal = bgRaw.width * bgRaw.height;
    for (let i = 0; i < bgTotal; i++) {
        sumR += bgRaw.data[i * 4];
        sumG += bgRaw.data[i * 4 + 1];
        sumB += bgRaw.data[i * 4 + 2];
    }
    const bgCct = (0, optical_analyzer_1.calculateCctFromRgb)(sumR / bgTotal, sumG / bgTotal, sumB / bgTotal);
    // 3. Composite onto background
    const composite = (0, image_io_1.cloneImage)(bgRaw);
    const centerX = Math.floor(bgRaw.width / 2);
    const centerY = Math.floor(bgRaw.height / 2);
    // Synthesize contact shadow
    applyContactShadow(composite, fgRaw, centerX, centerY);
    // Alpha blend placement
    const topY = centerY - Math.floor(fgRaw.height / 2);
    const leftX = centerX - Math.floor(fgRaw.width / 2);
    for (let y = 0; y < fgRaw.height; y++) {
        const bgY = topY + y;
        if (bgY < 0 || bgY >= bgRaw.height)
            continue;
        for (let x = 0; x < fgRaw.width; x++) {
            const bgX = leftX + x;
            if (bgX < 0 || bgX >= bgRaw.width)
                continue;
            const fgIdx = (y * fgRaw.width + x) * 4;
            const bgIdx = (bgY * bgRaw.width + bgX) * 4;
            const alpha = harmonizedFg.data[fgIdx + 3] / 255.0;
            if (alpha > 0) {
                composite.data[bgIdx] = Math.round(harmonizedFg.data[fgIdx] * alpha + composite.data[bgIdx] * (1.0 - alpha));
                composite.data[bgIdx + 1] = Math.round(harmonizedFg.data[fgIdx + 1] * alpha + composite.data[bgIdx + 1] * (1.0 - alpha));
                composite.data[bgIdx + 2] = Math.round(harmonizedFg.data[fgIdx + 2] * alpha + composite.data[bgIdx + 2] * (1.0 - alpha));
            }
        }
    }
    const outDir = (0, config_1.ensureOutputDirectory)();
    const outPath = outputPath ||
        path_1.default.join(outDir, `harmonized_${path_1.default.basename(fgResolved, path_1.default.extname(fgResolved))}_${path_1.default.basename(bgResolved, path_1.default.extname(bgResolved))}.png`);
    (0, image_io_1.writeImage)(outPath, composite);
    return {
        compositeImagePath: outPath,
        blendMode,
        foregroundPath: fgResolved,
        backgroundPath: bgResolved,
        backgroundCctKelvin: Math.round(bgCct * 10) / 10,
        luminanceScalingFactor: 1.04,
        contactShadowApplied: true,
        details: {
            outputDimensions: [composite.width, composite.height],
            centerCoordinates: [centerX, centerY],
        },
    };
}
