"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readImage = readImage;
exports.writeImage = writeImage;
exports.cloneImage = cloneImage;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pngjs_1 = require("pngjs");
const jpeg_js_1 = __importDefault(require("jpeg-js"));
const errors_1 = require("../core/errors");
function readImage(filePath) {
    if (!fs_1.default.existsSync(filePath)) {
        throw new errors_1.ImageProcessingError(`Image file not found: '${filePath}'`);
    }
    const ext = path_1.default.extname(filePath).toLowerCase();
    const fileBuffer = fs_1.default.readFileSync(filePath);
    try {
        if (ext === ".png") {
            const png = pngjs_1.PNG.sync.read(fileBuffer);
            return {
                width: png.width,
                height: png.height,
                data: png.data,
            };
        }
        else if (ext === ".jpg" || ext === ".jpeg") {
            const rawJpeg = jpeg_js_1.default.decode(fileBuffer, { useTArray: false });
            return {
                width: rawJpeg.width,
                height: rawJpeg.height,
                data: rawJpeg.data,
            };
        }
        else {
            throw new errors_1.ImageProcessingError(`Unsupported format: '${ext}'. Use .png, .jpg, or .jpeg.`);
        }
    }
    catch (err) {
        if (err instanceof errors_1.ImageProcessingError)
            throw err;
        throw new errors_1.ImageProcessingError(`Failed to decode image '${filePath}': ${err.message}`);
    }
}
function writeImage(filePath, image) {
    const ext = path_1.default.extname(filePath).toLowerCase();
    const dir = path_1.default.dirname(filePath);
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    try {
        if (ext === ".png") {
            const png = new pngjs_1.PNG({ width: image.width, height: image.height });
            image.data.copy(png.data);
            const buffer = pngjs_1.PNG.sync.write(png);
            fs_1.default.writeFileSync(filePath, buffer);
        }
        else if (ext === ".jpg" || ext === ".jpeg") {
            const jpegData = jpeg_js_1.default.encode({
                data: image.data,
                width: image.width,
                height: image.height,
            }, 95);
            fs_1.default.writeFileSync(filePath, jpegData.data);
        }
        else {
            // Default to PNG
            const png = new pngjs_1.PNG({ width: image.width, height: image.height });
            image.data.copy(png.data);
            const buffer = pngjs_1.PNG.sync.write(png);
            fs_1.default.writeFileSync(filePath, buffer);
        }
    }
    catch (err) {
        throw new errors_1.ImageProcessingError(`Failed to write image to '${filePath}': ${err.message}`);
    }
}
function cloneImage(img) {
    const buf = Buffer.alloc(img.data.length);
    img.data.copy(buf);
    return {
        width: img.width,
        height: img.height,
        data: buf,
    };
}
