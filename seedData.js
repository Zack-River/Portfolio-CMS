const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, '../Portfolio-Front/data.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(rawData);

  // Find the admin user
  const user = await prisma.user.findFirst({ where: { email: 'zackriver.dev@gmail.com' } });
  if (!user) {
    console.error('Admin user not found!');
    return;
  }

  // 1. PortfolioSettings (About Text)
  await prisma.portfolioSettings.upsert({
    where: { userId: user.id },
    update: { aboutText: data.PERSONAL_INFO.bio, aboutImageUrl: '/projects/Ahmed-Hakim-Portfolio.webp' },
    create: { userId: user.id, aboutText: data.PERSONAL_INFO.bio, aboutImageUrl: '/projects/Ahmed-Hakim-Portfolio.webp' }
  });

  // 2. Work (Education & Training)
  // Delete existing to avoid duplicates
  await prisma.work.deleteMany({ where: { userId: user.id } });
  
  if (data.EDUCATION) {
    await prisma.work.create({
      data: {
        userId: user.id,
        company: data.EDUCATION.institution,
        position: data.EDUCATION.degree,
        startDate: data.EDUCATION.period.split(' – ')[0],
        endDate: data.EDUCATION.period.split(' – ')[1] || 'Present',
        description: `Grade: ${data.EDUCATION.grade}`,
        type: 'EDUCATION',
        tags: []
      }
    });
  }

  if (data.TRAINING && data.TRAINING.length > 0) {
    for (const t of data.TRAINING) {
      await prisma.work.create({
        data: {
          userId: user.id,
          company: t.company,
          position: t.role,
          startDate: t.period.split(' – ')[0],
          endDate: t.period.split(' – ')[1] || 'Present',
          description: t.details ? t.details.join('\n') : '',
          type: 'WORK',
          tags: []
        }
      });
    }
  }

  console.log('Migration complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
