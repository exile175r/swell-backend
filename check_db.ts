import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Swell Database Connection Check ---');

  try {
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();

    // 이 부분이 이전에 오류가 나던 지점입니다.
    // npx prisma generate를 통해 이제 정상적으로 인식되어야 합니다.
    const notiCount = await prisma.notification.count();

    console.log(`✅ User count: ${userCount}`);
    console.log(`✅ Post count: ${postCount}`);
    console.log(`✅ Notification count: ${notiCount}`);
    console.log('--- All main tables are accessible ---');
  } catch (err) {
    console.error('❌ Database access failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
