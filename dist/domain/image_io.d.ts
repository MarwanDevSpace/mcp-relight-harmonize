export interface RawImage {
    width: number;
    height: number;
    data: Buffer;
}
export declare function readImage(filePath: string): RawImage;
export declare function writeImage(filePath: string, image: RawImage): void;
export declare function cloneImage(img: RawImage): RawImage;
