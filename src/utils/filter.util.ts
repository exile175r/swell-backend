const bannedWords = ['바보', '멍청이', '나쁜놈']; // 예시 금칙어 목록

/**
 * 금칙어를 별표(*)로 마스킹합니다.
 */
export const filterProfanity = (text: string): string => {
  let filteredText = text;
  bannedWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(word.length));
  });
  return filteredText;
};

/**
 * 타인 지칭 단어(너, 그 사람 등)를 감지하여 '나-전달법' 권장 여부를 확인합니다.
 */
export const detectOtherFocusedWords = (text: string): boolean => {
  const otherFocusedRegex = /너|그 사람|당신|지들이|걔네/g;
  return otherFocusedRegex.test(text);
};
