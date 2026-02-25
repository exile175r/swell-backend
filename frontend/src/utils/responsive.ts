import { Dimensions, PixelRatio, Platform } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// 기준 기판 (iPhone 14 / 가로 393px 기반)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

/**
 * 전역 반응형 척도 계산
 * Galaxy S24+ (약 412 x 892) 등 대화면 기기 대응
 */
const scale = SCREEN_WIDTH / BASE_WIDTH;

/**
 * @description 가로 길이에 따른 반응형 크기 반환
 */
export const wp = (size: number) => {
  return size * scale;
};

/**
 * @description 세로 길이에 따른 반응형 크기 반환
 */
export const hp = (size: number) => {
  return (size * SCREEN_HEIGHT) / BASE_HEIGHT;
};

/**
 * @description 폰트 크기 반응형 처리 (해상도 및 폰트 축척 고려)
 */
export const rf = (size: number) => {
  const newSize = size * scale;
  if (Platform.OS === "ios") {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2; // 안드로이드 미세 조정
  }
};

/**
 * @description 현재 기기 정보 (Galaxy S24+ 등 식별용 참고)
 */
export const isLargeScreen = SCREEN_WIDTH >= 400; // S24+ 등 대화면 기기 판별용
export const isWideScreen = SCREEN_WIDTH > 450; // 태블릿/폴더블 판별용

export const DeviceSize = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};
