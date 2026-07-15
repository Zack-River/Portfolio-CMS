import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(localPath: string, folder: string) {
  try {
    const publicPath = path.resolve(__dirname, '../../Portfolio-Front/public', localPath.replace(/^\//, ''));
    if (!fs.existsSync(publicPath)) {
      console.log(`File not found: ${publicPath}`);
      return null;
    }
    const result = await cloudinary.uploader.upload(publicPath, {
      folder,
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (error) {
    console.error(`Error uploading ${localPath}:`, error);
    return null;
  }
}

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found");
    return;
  }

  console.log("Migrating About Image...");
  if (user.aboutImageUrl && !user.aboutImageUrl.startsWith('http')) {
    const newUrl = await uploadToCloudinary(user.aboutImageUrl, 'portfolio/about');
    if (newUrl) {
      await prisma.user.update({
        where: { id: user.id },
        data: { aboutImageUrl: newUrl }
      });
      console.log(`Updated About Image: ${newUrl}`);
    }
  } else {
    console.log("About image already migrated or not set.");
  }

  console.log("Migrating Client Logos...");
  const clients = await prisma.client.findMany({ where: { userId: user.id } });
  for (const client of clients) {
    if (client.logoUrl && !client.logoUrl.startsWith('http')) {
      const newUrl = await uploadToCloudinary(client.logoUrl, 'portfolio/clients');
      if (newUrl) {
        await prisma.client.update({
          where: { id: client.id },
          data: { logoUrl: newUrl }
        });
        console.log(`Updated Client ${client.name} logo: ${newUrl}`);
      }
    } else {
      console.log(`Client ${client.name} logo already migrated or not set.`);
    }
  }

  console.log("Migration complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
