const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultNavItems = [
  { id: 'home', icon: 'Home', label: 'Home' },
  { id: 'about', icon: 'User', label: 'About' },
  { id: 'skills', icon: 'Code', label: 'Skills' },
  { id: 'projects', icon: 'Layers', label: 'Works' },
  { id: 'testimonials', icon: 'Users', label: 'Clients' },
  { id: 'services', icon: 'Briefcase', label: 'Services' },
  { id: 'contact', icon: 'Mail', label: 'Contact' },
];

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found");
    return;
  }

  const existingNavs = await prisma.navItem.count({ where: { userId: user.id } });
  if (existingNavs > 0) {
    console.log("NavItems already seeded.");
    return;
  }

  console.log("Seeding NavItems...");
  for (let i = 0; i < defaultNavItems.length; i++) {
    const item = defaultNavItems[i];
    await prisma.navItem.create({
      data: {
        userId: user.id,
        label: item.label,
        sectionId: item.id,
        icon: item.icon,
        order: i,
        isVisible: true
      }
    });
  }

  console.log("NavItems seeded!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
