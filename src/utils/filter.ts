import prisma from '../services/prisma.service';

/**
 * @description 기본 비속어 목록 (한국어)
 * 추후 BannedWord 테이블과 병합하여 사용합니다.
 */
const DEFAULT_BANNED_WORDS = [
  '시발', '씨발', '개새끼', '병신', '지랄', '존나', '좆', '닥쳐', '미친놈', '미친년',
  '호로', '쌍놈', '창녀', '느금마', '엠창', '상놈', '쓰레기', '걸레'
];

/**
 * @description 동일한 문자가 과도하게 반복되는지 확인합니다. (예: 'ㅋㅋㅋㅋㅋㅋ')
 */
export const checkRepeatedChars = (text: string): boolean => {
  // 동일 문자가 10회 이상 반복되는 패턴 감지
  const repeatedCharRegex = /(.)\1{9,}/u;
  return repeatedCharRegex.test(text);
};

/**
 * @description 도배 방지 (Rate Limit) 체크
 * 최근 1분 내에 해당 사용자가 작성한 게시글/댓글 수를 확인하여 제한합니다.
 */
export const checkRateLimit = async (userId: string, type: 'post' | 'comment'): Promise<boolean> => {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  let count = 0;
  try {
    if (type === 'post') {
      count = await prisma.post.count({
        where: { userId, createdAt: { gte: oneMinuteAgo } }
      });
    } else {
      count = await prisma.comment.count({
        where: { userId, createdAt: { gte: oneMinuteAgo } }
      });
    }
  } catch (error) {
    return true; // 에러 발생 시 허용
  }

  return count < 5;
};

/**
 * @description 텍스트에서 비속어 및 금지어를 ***로 마스킹 처리합니다.
 */
export const filterContent = async (text: string): Promise<string> => {
  if (!text) return '';

  // 1. DB에서 금지어 목록 가져오기 (캐싱 고려 가능)
  const dbBannedWords = await (prisma as any).bannedWord.findMany({
    select: { word: true }
  }).catch(() => []);

  const allBannedWords = [
    ...DEFAULT_BANNED_WORDS,
    ...(dbBannedWords ? dbBannedWords.map((bw: any) => bw.word) : [])
  ];

  let filteredText = text;

  // 2. 금지어 마스킹 실행
  allBannedWords.forEach(word => {
    if (!word) return;
    // 대소문자 구분 없이, 모든 일치 항목 치환
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    filteredText = filteredText.replace(regex, (match) => '*'.repeat(match.length));
  });

  return filteredText;
};
