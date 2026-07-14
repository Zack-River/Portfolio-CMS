import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateSkills() {
  console.log('Starting skills migration...');
  
  // Find all users
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    // Check if user has skills that are missing a skillGroupId
    const unassignedSkills = await prisma.skill.findMany({
      where: { userId: user.id, skillGroupId: null }
    });
    
    if (unassignedSkills.length > 0) {
      console.log(`User ${user.email} has ${unassignedSkills.length} unassigned skills. Creating default group...`);
      
      let defaultGroup = await prisma.skillGroup.findFirst({
        where: { userId: user.id, name: 'Default Skills' }
      });
      
      if (!defaultGroup) {
        defaultGroup = await prisma.skillGroup.create({
          data: {
            userId: user.id,
            name: 'Default Skills',
            isVisible: true,
            order: 0
          }
        });
      }
      
      // Update all unassigned skills to point to the default group
      await prisma.skill.updateMany({
        where: { userId: user.id, skillGroupId: null },
        data: { skillGroupId: defaultGroup.id }
      });
      console.log(`Successfully assigned skills to group ${defaultGroup.id}`);
    }
  }
  
  console.log('Migration complete!');
}

migrateSkills().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
