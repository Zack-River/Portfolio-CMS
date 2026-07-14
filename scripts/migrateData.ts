import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DATA_PATH = path.resolve(__dirname, '../../Portfolio-Front/data.json');
const PUBLIC_DIR = path.resolve(__dirname, '../../Portfolio-Front/public');

async function uploadImage(localPath: string, folderName: string): Promise<string | null> {
  if (!localPath) return null;
  
  // Clean up the local path (e.g., "/projects/beeplayer/Cover.webp" -> "projects/beeplayer/Cover.webp")
  const relativePath = localPath.startsWith('/') ? localPath.slice(1) : localPath;
  const fullPath = path.join(PUBLIC_DIR, relativePath);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`[WARNING] File not found: ${fullPath}`);
    return null;
  }
  
  try {
    const result = await cloudinary.uploader.upload(fullPath, {
      folder: `portfolio/${folderName}`,
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    });
    console.log(`[SUCCESS] Uploaded to: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`[ERROR] Failed to upload ${fullPath}:`, error);
    return null;
  }
}

async function migrateHero(adminUserId: string, data: any) {
  console.log('--- Migrating Hero Section ---');
  await prisma.heroSection.upsert({
    where: { userId: adminUserId },
    update: {
      name: data.PERSONAL_INFO.name,
      title: data.PERSONAL_INFO.title,
      about: data.PERSONAL_INFO.bio,
    },
    create: {
      userId: adminUserId,
      name: data.PERSONAL_INFO.name,
      title: data.PERSONAL_INFO.title,
      about: data.PERSONAL_INFO.bio,
    }
  });
  console.log('HeroSection created/updated.');
}

async function migrateProjects(adminUserId: string, data: any) {
  console.log('\n--- Migrating Projects ---');
  
  // Delete existing projects first to avoid duplicates during migration
  await prisma.project.deleteMany({ where: { userId: adminUserId } });

  let order = 1;
  for (const proj of data.PROJECTS) {
    console.log(`Processing project: ${proj.title}`);
    
    // Determine folder name from the ID or original path
    const folderName = `projects/${proj.id}`;

    // Upload cover image
    const coverUrl = await uploadImage(proj.image, folderName);

    // Upload gallery images
    const galleryUrls: string[] = [];
    if (proj.gallery && Array.isArray(proj.gallery)) {
      for (const gal of proj.gallery) {
        const galUrl = await uploadImage(gal, folderName);
        if (galUrl) galleryUrls.push(galUrl);
      }
    }

    // Add gallery urls to the description or store them as json in a custom field
    // Since Prisma schema doesn't have a gallery field by default, we'll append to description or something,
    // or just leave them in Cloudinary for now. Wait, I can alter the schema to have a gallery JSON array!
    // But I will stick to current schema to avoid db resets if not strictly needed.
    
    await prisma.project.create({
      data: {
        userId: adminUserId,
        title: proj.title,
        description: proj.description,
        imageUrl: coverUrl || null,
        gallery: galleryUrls,
        link: proj.link,
        tags: proj.tags || [],
        order: order++,
      }
    });
  }
}

async function migrateServices(adminUserId: string, data: any) {
  console.log('\n--- Migrating Services ---');
  await prisma.service.deleteMany({ where: { userId: adminUserId } });

  let order = 1;
  for (const srv of data.SERVICES) {
    await prisma.service.create({
      data: {
        userId: adminUserId,
        title: srv.title,
        description: srv.description,
        icon: srv.icon,
        order: order++,
      }
    });
  }
}

async function migrateSkills(adminUserId: string, data: any) {
  console.log('\n--- Migrating Skills ---');
  await prisma.skill.deleteMany({ where: { userId: adminUserId } });

  let order = 1;
  for (const category of data.SKILL_CATEGORIES) {
    for (const skillName of category.skills) {
      await prisma.skill.create({
        data: {
          userId: adminUserId,
          name: `${category.title}: ${skillName}`,
          order: order++,
        }
      });
    }
  }
}

async function migrateContacts(adminUserId: string, data: any) {
  console.log('\n--- Migrating Contacts ---');
  await prisma.contact.deleteMany({ where: { userId: adminUserId } });
  
  await prisma.contact.create({
    data: {
      userId: adminUserId,
      email: data.PERSONAL_INFO.email,
      phone: data.PERSONAL_INFO.phone,
      socials: {
        linkedin: data.PERSONAL_INFO.linkedin,
        github: data.PERSONAL_INFO.github,
      }
    }
  });
}

async function main() {
  const adminEmail = 'admin@example.com';
  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    throw new Error('Admin user not found. Run seed first.');
  }

  const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
  const data = JSON.parse(rawData);

  await migrateHero(admin.id, data);
  await migrateServices(admin.id, data);
  await migrateSkills(admin.id, data);
  await migrateContacts(admin.id, data);
  await migrateProjects(admin.id, data);
  
  console.log('\nMigration Complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
