import React, { useEffect, useRef } from "react";
import { View, Text, Modal, Animated, Easing } from "react-native";
import WaveLogo from "./WaveLogo";
import { useUserStore } from "../store/userStore";

/**
 * @description 프리미엄 전역 로딩 컴포넌트
 * 애니메이션 효과와 브랜드 로고를 활용하여 지루하지 않은 대기 경험을 제공합니다.
 */
const GlobalLoading = () => {
  const isGlobalLoading = useUserStore((state) => state.isGlobalLoading);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isGlobalLoading) {
      // 컴포넌트가 로딩 상태일 때 애니메이션 시작
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // 로고 펄스 효과
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      // 로딩 종료 시 부드럽게 페이드 아웃
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isGlobalLoading]);

  if (!isGlobalLoading) return null;

  return (
    <Modal transparent visible={isGlobalLoading} animationType="none">
      <View
        style={{ flex: 1, backgroundColor: "rgba(0, 18, 32, 0.85)", alignItems: "center", justifyContent: "center" }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View
            className="w-24 h-24 bg-[#00E0D0] rounded-[32px] items-center justify-center shadow-2xl"
            style={{ elevation: 15 }}
          >
            <WaveLogo size={48} color="#001220" />
          </View>
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text className="text-[#00E0D0] font-bold text-lg tracking-[5px] uppercase">SWELLING...</Text>
            <Text className="text-[#E0E0E0]/40 text-xs mt-3 font-medium">이야기의 파도를 생성하고 있습니다</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default GlobalLoading;
