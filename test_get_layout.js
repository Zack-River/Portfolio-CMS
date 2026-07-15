const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  if (!user) { console.log('no user'); return; }
  
  const token = jwt.sign({ id: user.id }, 'fallback_secret');
  try {
    const res = await fetch('http://localhost:4000/api/admin/content/settings/layout', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.text();
    console.log("STATUS:", res.status, data);
  } catch (err) {
    console.log("ERROR:", err.message);
  }
}
test();
