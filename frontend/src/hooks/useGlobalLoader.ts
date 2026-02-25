import { useRef } from "react";
import { useUserStore } from "../store/userStore";

/**
 * @description 전역 로딩 제어를 위한 커스텀 훅
 * 지연 로딩(0.5초 이상 걸릴 때만 노출) 로직을 포함합니다.
 */
export const useGlobalLoader = () => {
  const setGlobalLoading = useUserStore((state) => state.setGlobalLoading);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * @description 로딩 시작 (지연 시간 적용)
   * @param delayMs 지연 시간 (기본 500ms)
   */
  const startLoading = (delayMs: number = 500) => {
    // 기존 타이머가 있다면 제거
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setGlobalLoading(true);
    }, delayMs);
  };

  /**
   * @description 로딩 즉시 시작
   */
  const startLoadingNow = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setGlobalLoading(true);
  };

  /**
   * @description 로딩 종료
   */
  const stopLoading = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setGlobalLoading(false);
  };

  return { startLoading, startLoadingNow, stopLoading };
};
