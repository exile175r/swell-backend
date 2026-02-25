import React, { useState } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { ArrowLeft, Calendar } from "lucide-react-native";
import { useUserStore } from "../store/userStore";
import { THEMES } from "../styles/theme";

/**
 * @description 생년월일 입력 화면
 */
const BirthYearScreen = ({ navigation }: any) => {
  const { appTheme, setBirthYear: saveBirthYear } = useUserStore();
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");

  const handleNext = () => {
    if (birthYear.length === 4 && birthMonth.length >= 1) {
      saveBirthYear(birthYear);
      navigation.navigate("Guide");
    }
  };

  const isValid =
    birthYear.length === 4 &&
    parseInt(birthYear) > 1900 &&
    parseInt(birthYear) < 2025 &&
    birthMonth.length >= 1 &&
    parseInt(birthMonth) >= 1 &&
    parseInt(birthMonth) <= 12;

  return (
    <SafeAreaView style={{ backgroundColor: THEMES[appTheme].bg }} className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <View className="px-8 py-10 flex-1">
          {/* Header */}
          <View className="flex-row items-center mb-12">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ backgroundColor: THEMES[appTheme].surface + "99", borderColor: THEMES[appTheme].text + "0D" }}
              className="w-12 h-12 rounded-2xl items-center justify-center border"
            >
              <ArrowLeft size={24} color={THEMES[appTheme].text} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View className="mb-12">
            <Text style={{ color: THEMES[appTheme].text }} className="text-3xl font-bold leading-tight mb-4">
              당신을 더 잘{"\n"}이해하고 싶어요
            </Text>
            <Text style={{ color: THEMES[appTheme].text }} className="opacity-50 text-lg">
              연령대에 맞는 공감 파도를{"\n"}추천해드리기 위해 필요합니다.
            </Text>
          </View>

          {/* Input Section */}
          <View className="space-y-6">
            <View>
              <Text
                style={{ color: THEMES[appTheme].accent }}
                className="text-xs font-bold mb-3 ml-1 tracking-widest uppercase"
              >
                Birth Year
              </Text>
              <View
                style={{ backgroundColor: THEMES[appTheme].surface + "66", borderColor: THEMES[appTheme].text + "0D" }}
                className="flex-row items-center h-[72px] rounded-[28px] px-6 border"
              >
                <Calendar size={20} color={THEMES[appTheme].accent} opacity={0.5} />
                <TextInput
                  placeholder="예: 1995"
                  placeholderTextColor={THEMES[appTheme].text + "33"}
                  className="flex-1 ml-4 text-xl font-bold"
                  style={{ color: THEMES[appTheme].text }}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={birthYear}
                  onChangeText={setBirthYear}
                />
                <Text style={{ color: THEMES[appTheme].text }} className="opacity-30 font-bold ml-2">
                  년
                </Text>
              </View>
            </View>

            <View>
              <Text
                style={{ color: THEMES[appTheme].accent }}
                className="text-xs font-bold mb-3 ml-1 tracking-widest uppercase"
              >
                Birth Month
              </Text>
              <View
                style={{ backgroundColor: THEMES[appTheme].surface + "66", borderColor: THEMES[appTheme].text + "0D" }}
                className="flex-row items-center h-[72px] rounded-[28px] px-6 border"
              >
                <Calendar size={20} color={THEMES[appTheme].accent} opacity={0.5} />
                <TextInput
                  placeholder="예: 5"
                  placeholderTextColor={THEMES[appTheme].text + "33"}
                  className="flex-1 ml-4 text-xl font-bold"
                  style={{ color: THEMES[appTheme].text }}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={birthMonth}
                  onChangeText={setBirthMonth}
                />
                <Text style={{ color: THEMES[appTheme].text }} className="opacity-30 font-bold ml-2">
                  월
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-auto">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleNext}
              disabled={!isValid}
              style={{ backgroundColor: isValid ? THEMES[appTheme].accent : THEMES[appTheme].surface }}
              className={`h-[68px] rounded-[30px] items-center justify-center shadow-2xl ${
                !isValid ? "opacity-50" : ""
              }`}
            >
              <Text style={{ color: THEMES[appTheme].bg }} className="text-xl font-bold">
                확인
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BirthYearScreen;
