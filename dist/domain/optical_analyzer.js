"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCctFromRgb = calculateCctFromRgb;
exports.computeSurfaceNormalsAndLightVector = computeSurfaceNormalsAndLightVector;
exports.analyzeOpticalProfileImpl = analyzeOpticalProfileImpl;
const security_1 = require("../core/security");
const image_io_1 = require("./image_io");
function calculateCctFromRgb(rMean, gMean, bMean) {
    const rNorm = Math.min(Math.max(rMean / 255.0, 0), 1);
    const gNorm = Math.min(Math.max(gMean / 255.0, 0), 1);
    const bNorm = Math.min(Math.max(bMean / 255.0, 0), 1);
    // Gamma linearization
    const rLin = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
    const gLin = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
    const bLin = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;
    // CIE 1931 XYZ (D65)
    const X = 0.4124564 * rLin + 0.3575761 * gLin + 0.1804375 * bLin;
    const Y = 0.2126729 * rLin + 0.7151522 * gLin + 0.072175 * bLin;
    const Z = 0.0193339 * rLin + 0.119192 * gLin + 0.9503041 * bLin;
    const total = X + Y + Z;
    if (total <= 1e-7)
        return 6500.0;
    const xChroma = X / total;
    const yChroma = Y / total;
    let denom = 0.1858 - yChroma;
    if (Math.abs(denom) < 1e-6)
        denom = denom >= 0 ? 1e-6 : -1e-6;
    const n = (xChroma - 0.332) / denom;
    const cct = 449.0 * Math.pow(n, 3) + 3525.0 * Math.pow(n, 2) + 6823.3 * n + 5520.33;
    return Math.min(Math.max(cct, 1500.0), 20000.0);
}
function computeSurfaceNormalsAndLightVector(lum, width, height) {
    const normalField = new Float32Array(width * height * 3);
    const scale = 8.0;
    let sumNx = 0;
    let sumNy = 0;
    let sumNz = 0;
    let weightSum = 0;
    let lumSum = 0;
    for (let i = 0; i < lum.length; i++)
        lumSum += lum[i];
    const meanLum = lumSum / lum.length;
    // Compute Sobel gradients
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            // Sobel horizontal
            const gx = -lum[(y - 1) * width + (x - 1)] +
                lum[(y - 1) * width + (x + 1)] -
                2 * lum[y * width + (x - 1)] +
                2 * lum[y * width + (x + 1)] -
                lum[(y + 1) * width + (x - 1)] +
                lum[(y + 1) * width + (x + 1)];
            // Sobel vertical
            const gy = -lum[(y - 1) * width + (x - 1)] -
                2 * lum[(y - 1) * width + x] -
                lum[(y - 1) * width + (x + 1)] +
                lum[(y + 1) * width + (x - 1)] +
                2 * lum[(y + 1) * width + x] +
                lum[(y + 1) * width + (x + 1)];
            const nx = -gx * scale;
            const ny = -gy * scale;
            const nz = 1.0;
            const mag = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1e-6;
            const normX = nx / mag;
            const normY = ny / mag;
            const normZ = nz / mag;
            const nIdx = idx * 3;
            normalField[nIdx] = normX;
            normalField[nIdx + 1] = normY;
            normalField[nIdx + 2] = normZ;
            // Weight by highlight surplus
            const w = Math.max(lum[idx] * 255.0 - meanLum * 255.0, 0) ** 2;
            sumNx += normX * w;
            sumNy += normY * w;
            sumNz += normZ * w;
            weightSum += w;
        }
    }
    // Roughness = std deviation of X and Y components
    let stdSum = 0;
    for (let i = 0; i < width * height; i++) {
        const nx = normalField[i * 3];
        const ny = normalField[i * 3 + 1];
        stdSum += nx * nx + ny * ny;
    }
    const roughness = Math.sqrt(stdSum / (width * height * 2));
    let lightVec;
    if (weightSum < 1e-5) {
        lightVec = [0.0, 0.0, 1.0];
    }
    else {
        const mag = Math.sqrt(sumNx * sumNx + sumNy * sumNy + sumNz * sumNz) || 1e-6;
        lightVec = [sumNx / mag, sumNy / mag, sumNz / mag];
    }
    // Azimuth & Elevation
    const cartX = lightVec[0];
    const cartY = -lightVec[1];
    const azRad = Math.atan2(cartY, cartX);
    const azimuthDeg = ((azRad * 180.0) / Math.PI + 360.0) % 360.0;
    const planarLen = Math.sqrt(cartX * cartX + cartY * cartY);
    const elRad = Math.atan2(lightVec[2], Math.max(planarLen, 1e-6));
    const elevationDeg = Math.min(Math.max((elRad * 180.0) / Math.PI, 0.0), 90.0);
    return {
        normalField,
        roughness,
        lightVector: [
            Math.round(lightVec[0] * 10000) / 10000,
            Math.round(lightVec[1] * 10000) / 10000,
            Math.round(lightVec[2] * 10000) / 10000,
        ],
        angles: {
            azimuthDeg: Math.round(azimuthDeg * 100) / 100,
            elevationDeg: Math.round(elevationDeg * 100) / 100,
        },
    };
}
function analyzeOpticalProfileImpl(imagePath) {
    const resolvedPath = (0, security_1.validateImagePath)(imagePath);
    const raw = (0, image_io_1.readImage)(resolvedPath);
    const { width, height, data } = raw;
    const numPixels = width * height;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    const luminanceArray = new Float32Array(numPixels);
    const lumValues = new Array(numPixels);
    let specularCount = 0;
    let shadowsCount = 0;
    for (let i = 0; i < numPixels; i++) {
        const idx = i * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        sumR += r;
        sumG += g;
        sumB += b;
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        luminanceArray[i] = lum / 255.0;
        lumValues[i] = lum;
        if (lum > 235)
            specularCount++;
        if (lum < 25)
            shadowsCount++;
    }
    const meanR = sumR / numPixels;
    const meanG = sumG / numPixels;
    const meanB = sumB / numPixels;
    const meanLum = 0.2126 * meanR + 0.7152 * meanG + 0.0722 * meanB;
    // Sort luminance for percentiles
    lumValues.sort((a, b) => a - b);
    const minLum = lumValues[0];
    const maxLum = lumValues[numPixels - 1];
    const p5 = lumValues[Math.floor(numPixels * 0.05)];
    const median = lumValues[Math.floor(numPixels * 0.5)];
    const p95 = lumValues[Math.floor(numPixels * 0.95)];
    const contrastRatio = (p95 + 1.0) / (p5 + 1.0);
    const specularPct = (specularCount / numPixels) * 100.0;
    const shadowsPct = (shadowsCount / numPixels) * 100.0;
    const midtonesPct = 100.0 - specularPct - shadowsPct;
    const cctKelvin = calculateCctFromRgb(meanR, meanG, meanB);
    const { roughness, lightVector, angles } = computeSurfaceNormalsAndLightVector(luminanceArray, width, height);
    const warmth = cctKelvin < 4000 ? "warm tungsten" : cctKelvin < 6500 ? "neutral daylight" : "cool atmospheric";
    const summary = `${width}x${height} image with ${warmth} illumination (${Math.round(cctKelvin)}K), ` +
        `mean luminance ${meanLum.toFixed(1)}/255, contrast ratio ${contrastRatio.toFixed(2)}:1, ` +
        `dominant light at azimuth ${angles.azimuthDeg}° elevation ${angles.elevationDeg}°.`;
    return {
        imagePath: resolvedPath,
        dimensions: [width, height],
        colorTemperatureKelvin: Math.round(cctKelvin * 10) / 10,
        dominantLightDirectionVector: lightVector,
        lightingAngles: angles,
        meanLuminance: Math.round(meanLum * 100) / 100,
        luminanceDynamics: {
            min: Math.round(minLum * 10) / 10,
            max: Math.round(maxLum * 10) / 10,
            p5: Math.round(p5 * 10) / 10,
            median: Math.round(median * 10) / 10,
            p95: Math.round(p95 * 10) / 10,
            contrastRatio: Math.round(contrastRatio * 100) / 100,
        },
        contrastZones: {
            specularHighlightsPct: Math.round(specularPct * 100) / 100,
            deepShadowsPct: Math.round(shadowsPct * 100) / 100,
            midtonesPct: Math.round(midtonesPct * 100) / 100,
        },
        surfaceNormalVariation: Math.round(roughness * 10000) / 10000,
        opticalProfileSummary: summary,
    };
}
