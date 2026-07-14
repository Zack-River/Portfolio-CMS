import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function exportSkills() {
  const skills = await prisma.skill.findMany();
  fs.writeFileSync('skills_export.json', JSON.stringify(skills, null, 2));
  console.log(`Exported ${skills.length} skills to skills_export.json`);
}

exportSkills()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
