import { OpticalProfileReport, LightingAngle } from "../contracts/types";
export declare function calculateCctFromRgb(rMean: number, gMean: number, bMean: number): number;
export declare function computeSurfaceNormalsAndLightVector(lum: Float32Array, width: number, height: number): {
    normalField: Float32Array;
    roughness: number;
    lightVector: [number, number, number];
    angles: LightingAngle;
};
export declare function analyzeOpticalProfileImpl(imagePath: string): OpticalProfileReport;
