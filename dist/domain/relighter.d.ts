import { RelightVariationsResult } from "../contracts/types";
import { RawImage } from "./image_io";
export declare function applyAmbientLighting(raw: RawImage): {
    image: RawImage;
    adjustments: string[];
};
export declare function applyDramaticLighting(raw: RawImage): {
    image: RawImage;
    adjustments: string[];
};
export declare function applyRimLighting(raw: RawImage): {
    image: RawImage;
    adjustments: string[];
};
export declare function applyMoodLighting(raw: RawImage): {
    image: RawImage;
    adjustments: string[];
};
export declare function generateRelightVariationsImpl(imagePath: string, targetLighting?: string, outputDir?: string): RelightVariationsResult;
