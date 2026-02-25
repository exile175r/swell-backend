import React, { useState } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, Dimensions, ScrollView } from "react-native";
import { ArrowLeft, ShieldCheck, Heart, MessageCircle, Mic } from "lucide-react-native";
import { useUserStore } from "../store/userStore";
import { THEMES } from "../styles/theme";

const { width } = Dimensions.get("window");

/**
 * @description 서비스 이용 가이드 화면
 */
const GuideScreen = ({ navigation }: any) => {
  const { appTheme, setHasSeenGuide } = useUserStore();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: <Mic size={48} color={THEMES[appTheme].accent} />,
      title: "목소리로 전하는 진심",
      desc: "정제된 텍스트보다 따뜻한 목소리로\n당신의 오늘을 기록해보세요.",
    },
    {
      icon: <ShieldCheck size={48} color={THEMES[appTheme].accent} />,
      title: "철저한 익명성 보장",
      desc: "너울은 당신의 신분을 묻지 않습니다.\n오직 목소리와 감정으로만 소통하세요.",
    },
    {
      icon: <Heart size={48} color={THEMES[appTheme].accent} />,
      title: "함께 타는 공감의 파도",
      desc: "비슷한 감정을 가진 이들과\n따뜻한 위로와 응원을 나누어보세요.",
    },
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      setHasSeenGuide(true);
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: THEMES[appTheme].bg }} className="flex-1">
      <View className="flex-1 px-8 py-10">
        {/* Progress Bar */}
        <View className="flex-row space-x-2 mb-12">
          {steps.map((_, i) => (
            <View
              key={i}
              style={{ backgroundColor: i <= activeStep ? THEMES[appTheme].accent : THEMES[appTheme].text + "1A" }}
              className="h-1.5 flex-1 rounded-full"
            />
          ))}
        </View>

        {/* Content */}
        <View className="flex-1 justify-center items-center">
          <View
            style={{ backgroundColor: THEMES[appTheme].accent + "1A", borderColor: THEMES[appTheme].accent + "33" }}
            className="w-24 h-24 rounded-[35px] items-center justify-center mb-10 border"
          >
            {steps[activeStep].icon}
          </View>

          <Text style={{ color: THEMES[appTheme].text }} className="text-3xl font-bold mb-6 text-center">
            {steps[activeStep].title}
          </Text>

          <Text style={{ color: THEMES[appTheme].text }} className="opacity-60 text-lg text-center leading-8">
            {steps[activeStep].desc}
          </Text>
        </View>

        {/* Footer */}
        <View className="mt-auto">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNext}
            style={{ backgroundColor: THEMES[appTheme].accent }}
            className="h-[68px] rounded-[30px] items-center justify-center shadow-2xl"
          >
            <Text style={{ color: THEMES[appTheme].bg }} className="text-xl font-bold">
              {activeStep === steps.length - 1 ? "파도 타기 시작" : "다음"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setHasSeenGuide(true);
              navigation.reset({
                index: 0,
                routes: [{ name: "Home" }],
              });
            }}
            className="items-center py-6"
          >
            <Text style={{ color: THEMES[appTheme].text }} className="opacity-30 font-bold">
              가이드 건너뛰기
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default GuideScreen;
