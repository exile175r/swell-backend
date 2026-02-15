const adjectives = [
  '행복한', '슬픈', '분노한', '고민하는', '꿈꾸는', '지친', '활기찬', '센치한', '무덤덤한', '섬세한',
  '용감한', '부끄러운', '따뜻한', '차가운', '단단한', '유연한', '빛나는', '어두운', '고요한', '활기찬'
];

const nouns = [
  '그림자', '파도', '구름', '바람', '햇살', '달빛', '나무', '바위', '조약돌', '낙엽',
  '너울', '항해자', '관찰자', '방랑자', '기록자', '여행가', '예술가', '사색가', '나무늘보', '고양이'
];

/**
 * 랜덤한 익명 닉네임을 생성합니다. (예: "행복한 파도")
 */
export const generateRandomNickname = (): string => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
};
