const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearAllImages() {
  try {
    console.log('Clearing all user images from database...');

    // Set all user images to null
    const result = await prisma.user.updateMany({
      data: {
        image: null,
      },
    });

    console.log(`✅ Cleared ${result.count} user images`);
    console.log('All users now have no avatar');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllImages();
