import request from 'supertest';
import app from '../app';
import prisma from '../services/prisma.service';

describe('Swell API 통합 테스트', () => {
  const userAId = 'user-a-' + Date.now();
  const userBId = 'user-b-' + Date.now();
  let postBId: number;

  beforeAll(async () => {
    // 테스트용 유저 A, B 생성
    await prisma.user.upsert({
      where: { id: userAId },
      update: {},
      create: { id: userAId, nickname: '테스터A', bio: 'A' }
    });
    await prisma.user.upsert({
      where: { id: userBId },
      update: {},
      create: { id: userBId, nickname: '테스터B', bio: 'B' }
    });
  });

  afterAll(async () => {
    try {
      // Cleanup: B의 게시글 관련 데이터 및 유저 삭제
      if (postBId) {
        await prisma.notification.deleteMany({ where: { userId: userBId } });
        await prisma.reaction.deleteMany({ where: { postId: postBId } });
        await prisma.post.deleteMany({ where: { id: postBId } });
      }
      await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    } catch (error) {
      console.error('Cleanup error:', error);
    } finally {
      await prisma.$disconnect();
    }
  });

  it('Health Check: 서버가 정상적으로 응답해야 함', async () => {
    const res = await request(app as any).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('Scenario: 유저 B가 게시글을 작성하고, 유저 A가 좋아요를 남기면 알림이 생성되어야 함', async () => {
    // 1. 유저 B가 게시글 작성
    const postRes = await request(app as any)
      .post('/api/posts')
      .send({
        userId: userBId,
        content: '유저 B의 게시글입니다.',
        hasVote: false
      });
    expect(postRes.status).toBe(201);
    postBId = postRes.body.id;

    // 2. 유저 A가 유저 B의 게시글에 좋아요 남김
    const reactionRes = await request(app as any)
      .post(`/api/posts/${postBId}/reaction`)
      .send({
        userId: userAId,
        type: 'like'
      });
    expect(reactionRes.status).toBe(200);
    expect(reactionRes.body.success).toBe(true);

    // 3. 유저 B에게 알림이 생성되었는지 확인
    const notiRes = await request(app as any).get(`/api/notifications?userId=${userBId}`);
    expect(notiRes.status).toBe(200);
    expect(notiRes.body.length).toBeGreaterThan(0);
    expect(notiRes.body[0].type).toBe('reaction');
  });
});
