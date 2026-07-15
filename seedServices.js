const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'zackriver.dev@gmail.com' }
  });

  if (!user) {
    console.error('User not found!');
    process.exit(1);
  }

  // Delete old services
  await prisma.service.deleteMany({
    where: { userId: user.id }
  });

  console.log('Old services deleted.');

  // Create new services
  const servicesData = [
    {
      userId: user.id,
      title: "Branding Websites",
      description: "High-end digital experiences designed to showcase your brand with impact and style.",
      highlights: ["Portfolios", "Landing Pages", "Brand Showcase Websites"],
      icon: "Layout",
      order: 0
    },
    {
      userId: user.id,
      title: "Websites & Web Apps",
      description: "Complex, scalable systems built with modern architecture and seamless user experiences.",
      highlights: ["ERPs", "CMS", "E-Commerce", "Online SaaS Apps"],
      icon: "AppWindow",
      order: 1
    },
    {
      userId: user.id,
      title: "Online Consultation",
      description: "Expert guidance on system design, code architecture, and technical problem-solving.",
      highlights: ["Frontend / Backend", "Desktop & Mobile Apps", "System Architecture", "Projects Document Writing", "QA Testing"],
      icon: "Stethoscope",
      order: 2
    }
  ];

  for (const s of servicesData) {
    await prisma.service.create({ data: s });
  }

  console.log('New services seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
