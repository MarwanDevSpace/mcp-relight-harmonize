import { HarmonizeCompositeResult } from "../contracts/types";
import { RawImage } from "./image_io";
export declare function reinhardColorTransfer(fg: RawImage, bg: RawImage): RawImage;
export declare function applyContactShadow(bg: RawImage, fg: RawImage, centerX: number, centerY: number): void;
export declare function harmonizeCompositeImpl(foregroundPath: string, backgroundPath: string, blendMode?: string, outputPath?: string): HarmonizeCompositeResult;
