"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImageToWebp = void 0;
const sharp_1 = __importDefault(require("sharp"));
const cloudinary_1 = require("cloudinary");
const streamifier_1 = __importDefault(require("streamifier"));
const uuid_1 = require("uuid");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const processImageToWebp = async (req, res, next) => {
    if (!req.file) {
        return next();
    }
    try {
        // Process image: convert to webp
        const webpBuffer = await (0, sharp_1.default)(req.file.buffer)
            .webp({ quality: 80 })
            .toBuffer();
        const uploadFromBuffer = (buffer) => {
            return new Promise((resolve, reject) => {
                const cld_upload_stream = cloudinary_1.v2.uploader.upload_stream({
                    folder: 'portfolio',
                    public_id: (0, uuid_1.v4)(),
                    resource_type: 'image',
                }, (error, result) => {
                    if (result) {
                        resolve(result);
                    }
                    else {
                        reject(error);
                    }
                });
                streamifier_1.default.createReadStream(buffer).pipe(cld_upload_stream);
            });
        };
        const result = await uploadFromBuffer(webpBuffer);
        // Add the Cloudinary secure URL to the request object
        req.body.imageUrl = result.secure_url;
        next();
    }
    catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ message: 'Error processing image' });
    }
};
exports.processImageToWebp = processImageToWebp;
