const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '../Portfolio-Front/data.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(rawData);

  const user = await prisma.user.findFirst({ where: { email: 'zackriver.dev@gmail.com' } });
  if (!user) {
    console.error('Admin user not found!');
    return;
  }

  // Projects
  await prisma.project.deleteMany({ where: { userId: user.id } });
  if (data.PROJECTS) {
    let order = 0;
    for (const p of data.PROJECTS) {
      await prisma.project.create({
        data: {
          userId: user.id,
          title: p.title,
          description: p.description,
          imageUrl: p.image,
          gallery: p.gallery || [],
          link: p.link || '',
          repo: p.repo || '',
          tags: p.tags || [],
          featured: p.featured || false,
          featuredOrder: p.featured ? order++ : 0,
          isVisible: true,
          colSpan: 1,
          rowSpan: 1,
          order: order
        }
      });
      order++;
    }
  }

  // Services
  await prisma.service.deleteMany({ where: { userId: user.id } });
  if (data.SERVICES) {
    let order = 0;
    for (const s of data.SERVICES) {
      await prisma.service.create({
        data: {
          userId: user.id,
          title: s.title,
          description: s.description,
          icon: s.icon,
          order: order++
        }
      });
    }
  }

  // Skills
  await prisma.skillGroup.deleteMany({ where: { userId: user.id } }); // This cascades to Skills
  if (data.SKILL_CATEGORIES) {
    let order = 0;
    for (const cat of data.SKILL_CATEGORIES) {
      const group = await prisma.skillGroup.create({
        data: {
          userId: user.id,
          name: cat.title,
          order: order++,
          isVisible: true
        }
      });
      let sOrder = 0;
      for (const skillName of cat.skills) {
        await prisma.skill.create({
          data: {
            userId: user.id,
            skillGroupId: group.id,
            name: skillName,
            order: sOrder++,
            isVisible: true
          }
        });
      }
    }
  }

  console.log('Migration of Projects, Services, Skills complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
