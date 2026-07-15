import 'dotenv/config';
import prisma from './src/db';

async function test() {
  try {
    const user = await prisma.user.findFirst();
    print("Success");
  } catch(e) {
    console.error(e);
  }
}
test();
