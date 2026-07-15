const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TESTIMONIALS = [
  {
    name: "Mostafa N.",
    rating: 5,
    review: "Honestly, working with Zack was very comfortable. He understands his work and delivered a website better than I imagined. Delivery was on time with no delays.",
    logoUrl: "/clients/mostafa.webp"
  },
  {
    name: "Jaffar S.",
    rating: 5,
    review: "Truly professional work! The site is fast and very elegant. Most importantly, he followed up with me step by step until everything was perfect.",
    logoUrl: "/clients/jaffar.webp"
  },
  {
    name: "Ali I.",
    rating: 5,
    review: "One of the best engineers I've dealt with. He always finds solutions to complex programming challenges and the design was a perfect fit for my brand. Highly recommended.",
    logoUrl: "/clients/ahmed.webp"
  },
  {
    name: "Heba A.",
    rating: 5,
    review: "An exceptionally skilled and dedicated developer who is honest, reliable, and highly professional. I would gladly recommend him to anyone looking for quality work.",
    logoUrl: "/clients/heba.webp"
  }
];

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found!");
    return;
  }

  // Delete existing clients to avoid duplication
  await prisma.client.deleteMany({
    where: { userId: user.id }
  });

  for (let i = 0; i < TESTIMONIALS.length; i++) {
    const t = TESTIMONIALS[i];
    await prisma.client.create({
      data: {
        userId: user.id,
        name: t.name,
        rating: t.rating,
        review: t.review,
        logoUrl: t.logoUrl,
        order: i,
      }
    });
  }

  console.log("Clients successfully seeded!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
