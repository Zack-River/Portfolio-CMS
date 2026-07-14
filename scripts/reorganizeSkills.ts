import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reorganizeSkills() {
  console.log('Starting skill reorganization...');
  
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    const skills = await prisma.skill.findMany({
      where: { userId: user.id }
    });
    
    console.log(`Found ${skills.length} skills for user ${user.email}`);
    
    // Map to keep track of created groups to avoid redundant DB queries
    const groupCache = new Map<string, string>();
    
    for (const skill of skills) {
      if (skill.name.includes(':')) {
        const [categoryName, ...rest] = skill.name.split(':');
        const newSkillName = rest.join(':').trim();
        const groupName = categoryName.trim();
        
        // 1. Get or create the SkillGroup
        let groupId = groupCache.get(groupName);
        if (!groupId) {
          let group = await prisma.skillGroup.findFirst({
            where: { userId: user.id, name: groupName }
          });
          
          if (!group) {
            group = await prisma.skillGroup.create({
              data: {
                userId: user.id,
                name: groupName,
                isVisible: true,
                order: groupCache.size // just some default ordering
              }
            });
            console.log(`Created new category: ${groupName}`);
          }
          groupId = group.id;
          groupCache.set(groupName, groupId);
        }
        
        // 2. Update the skill
        await prisma.skill.update({
          where: { id: skill.id },
          data: {
            name: newSkillName,
            skillGroupId: groupId
          }
        });
      }
    }
    
    // Cleanup: Remove "Default Skills" if it has 0 skills
    const defaultGroup = await prisma.skillGroup.findFirst({
      where: { userId: user.id, name: 'Default Skills' },
      include: { _count: { select: { skills: true } } }
    });
    
    if (defaultGroup && defaultGroup._count.skills === 0) {
      await prisma.skillGroup.delete({ where: { id: defaultGroup.id } });
      console.log('Deleted empty "Default Skills" group');
    }
  }
  
  console.log('Reorganization complete!');
}

reorganizeSkills()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
