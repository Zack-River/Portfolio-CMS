import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { v4 as uuidv4 } from 'uuid';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const processImageToWebp = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file && !req.files) {
    return next();
  }

  try {
    let folderPath = 'portfolio';
    if (req.params.model) {
      folderPath = `portfolio/${req.params.model}`;
    } else if (req.path.includes('/settings/about')) {
      folderPath = `portfolio/about`;
    }

    const uploadFromBuffer = (buffer: Buffer) => {
      return new Promise<any>((resolve, reject) => {
        const cld_upload_stream = cloudinary.uploader.upload_stream(
          {
            folder: folderPath,
            public_id: uuidv4(),
            resource_type: 'image',
          },
          (error: any, result: any) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(buffer).pipe(cld_upload_stream);
      });
    };

    const processFile = async (file: Express.Multer.File) => {
      const webpBuffer = await sharp(file.buffer)
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
      } else {
        for (const field in req.files) {
          const files = req.files[field];
          req.body[`${field}Urls`] = await Promise.all(files.map(processFile));
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ message: 'Error processing image' });
  }
};
