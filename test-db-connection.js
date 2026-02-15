require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@'));

  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to database!');

    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Query successful! User count: ${userCount}`);

    await prisma.$disconnect();
    console.log('✅ Connection test complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
