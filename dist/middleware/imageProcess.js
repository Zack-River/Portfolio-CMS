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
    if (!req.file && !req.files) {
        return next();
    }
    try {
        let folderPath = 'portfolio';
        if (req.params.model) {
            folderPath = `portfolio/${req.params.model}`;
        }
        else if (req.path.includes('/settings/about')) {
            folderPath = `portfolio/about`;
        }
        const uploadFromBuffer = (buffer) => {
            return new Promise((resolve, reject) => {
                const cld_upload_stream = cloudinary_1.v2.uploader.upload_stream({
                    folder: folderPath,
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
        const processFile = async (file) => {
            const webpBuffer = await (0, sharp_1.default)(file.buffer)
                .webp({ quality: 80 })
                .toBuffer();
            const result = await uploadFromBuffer(webpBuffer);
            return result.secure_url;
        };
        if (req.file) {
            req.body.imageUrl = await processFile(req.file);
        }
        if (req.files) {
            if (Array.isArray(req.files)) {
                const urls = await Promise.all(req.files.map(processFile));
                req.body.galleryUrls = urls;
            }
            else {
                for (const field in req.files) {
                    const files = req.files[field];
                    req.body[`${field}Urls`] = await Promise.all(files.map(processFile));
                }
            }
        }
        next();
    }
    catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ message: 'Error processing image' });
    }
};
exports.processImageToWebp = processImageToWebp;
