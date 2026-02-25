import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft, Send, AlertTriangle, UserX, Bug, MessageCircle } from "lucide-react-native";
import { useUserStore } from "../store/userStore";
import { THEMES } from "../styles/theme";

/**
 * @description 고객센터 및 문의/신고 화면
 */
const SupportScreen = ({ navigation }: any) => {
  const [type, setType] = useState<"bug" | "report" | "general">("general");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { appTheme } = useUserStore();

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("알림", "제목과 내용을 모두 입력해 주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      // api.ts에 추가할 로직 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        "문의 완료",
        "문의가 성공적으로 완료되었습니다.\n소중한 의견을 바탕으로 더 발전하는 너울이 되겠습니다.",
        [{ text: "확인", onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert("오류", "전송에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: THEMES[appTheme].bg }} className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        {/* Header */}
        <View className="px-8 py-8 flex-row justify-between items-center border-b border-white/5">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center">
            <ArrowLeft size={28} color={THEMES[appTheme].text} />
          </TouchableOpacity>
          <Text style={{ color: THEMES[appTheme].text }} className="text-lg font-bold">
            고객센터
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-8 pt-8" showsVerticalScrollIndicator={false}>
          {/* Inquiry Type Selection */}
          <View className="mb-10">
            <Text
              style={{ color: THEMES[appTheme].text }}
              className="text-xs font-bold mb-6 tracking-widest px-2 opacity-40"
            >
              INQUIRY TYPE
            </Text>
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setType("general")}
                style={{
                  backgroundColor:
                    type === "general" ? THEMES[appTheme].accent + "1A" : THEMES[appTheme].surface + "66",
                  borderColor: type === "general" ? THEMES[appTheme].accent : "rgba(255,255,255,0.05)",
                }}
                className={`flex-1 p-5 rounded-[25px] border items-center justify-center`}
              >
                <MessageCircle
                  size={20}
                  color={type === "general" ? THEMES[appTheme].accent : THEMES[appTheme].text}
                  opacity={type === "general" ? 1 : 0.4}
                />
                <Text
                  style={{ color: type === "general" ? THEMES[appTheme].accent : THEMES[appTheme].text }}
                  className={`mt-2 text-xs font-bold ${type !== "general" && "opacity-40"}`}
                >
                  일반 문의
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setType("bug")}
                style={{
                  backgroundColor: type === "bug" ? THEMES[appTheme].accent + "1A" : THEMES[appTheme].surface + "66",
                  borderColor: type === "bug" ? THEMES[appTheme].accent : "rgba(255,255,255,0.05)",
                }}
                className={`flex-1 p-5 rounded-[25px] border items-center justify-center`}
              >
                <Bug
                  size={20}
                  color={type === "bug" ? THEMES[appTheme].accent : THEMES[appTheme].text}
                  opacity={type === "bug" ? 1 : 0.4}
                />
                <Text
                  style={{ color: type === "bug" ? THEMES[appTheme].accent : THEMES[appTheme].text }}
                  className={`mt-2 text-xs font-bold ${type !== "bug" && "opacity-40"}`}
                >
                  오류 제보
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setType("report")}
                style={{
                  backgroundColor: type === "report" ? "#E7433C1A" : THEMES[appTheme].surface + "66",
                  borderColor: type === "report" ? "#E7433C" : "rgba(255,255,255,0.05)",
                }}
                className={`flex-1 p-5 rounded-[25px] border items-center justify-center`}
              >
                <UserX
                  size={20}
                  color={type === "report" ? "#E7433C" : THEMES[appTheme].text}
                  opacity={type === "report" ? 1 : 0.4}
                />
                <Text
                  style={{ color: type === "report" ? "#E7433C" : THEMES[appTheme].text }}
                  className={`mt-2 text-xs font-bold ${type !== "report" && "opacity-40"}`}
                >
                  사용자 신고
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View className="space-y-6">
            <View>
              <Text
                style={{ color: THEMES[appTheme].text }}
                className="text-xs font-bold mb-4 tracking-widest px-2 opacity-40"
              >
                TITLE
              </Text>
              <View
                style={{ backgroundColor: THEMES[appTheme].surface + "66" }}
                className="rounded-[25px] border border-white/5 px-6 py-5"
              >
                <TextInput
                  placeholder="제목을 입력해 주세요"
                  placeholderTextColor={THEMES[appTheme].text + "20"}
                  style={{ color: THEMES[appTheme].text }}
                  className="text-[16px]"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            <View>
              <Text
                style={{ color: THEMES[appTheme].text }}
                className="text-xs font-bold mb-4 tracking-widest px-2 opacity-40"
              >
                DESCRIPTION
              </Text>
              <View
                style={{ backgroundColor: THEMES[appTheme].surface + "66" }}
                className="rounded-[35px] border border-white/5 px-6 py-6 min-h-[200px]"
              >
                <TextInput
                  multiline
                  placeholder={
                    type === "general"
                      ? "서비스 이용 관련 궁금한 점을 자유롭게 남겨주세요."
                      : type === "bug"
                        ? "오류가 발생한 상황을 자세히 적어주시면 큰 도움이 됩니다."
                        : "신고하실 사용자의 닉네임과 구체적인 사유를 적어주세요."
                  }
                  placeholderTextColor={THEMES[appTheme].text + "20"}
                  style={{ color: THEMES[appTheme].text }}
                  className="text-[16px] leading-7"
                  textAlignVertical="top"
                  value={content}
                  onChangeText={setContent}
                />
              </View>
            </View>
          </View>

          {/* Guidelines & Refund Policy */}
          <View
            style={{ backgroundColor: THEMES[appTheme].accent + "0D" }}
            className="mt-8 mb-6 p-6 rounded-[30px] border border-white/5"
          >
            <View className="flex-row items-start mb-4">
              <AlertTriangle size={18} color={THEMES[appTheme].accent} style={{ marginTop: 2 }} />
              <Text style={{ color: THEMES[appTheme].text }} className="text-xs leading-5 ml-3 flex-1 opacity-60">
                허위 신고나 욕설이 포함된 문의는 처리가 제한될 수 있습니다. 쾌적한 너울을 위해 협조해 주세요.
              </Text>
            </View>
            <View className="pt-4 border-t border-white/5">
              <Text style={{ color: THEMES[appTheme].accent }} className="text-xs font-bold mb-2">
                💳 결제 및 환불 안내
              </Text>
              <Text style={{ color: THEMES[appTheme].text }} className="text-[11px] leading-5 opacity-40">
                너울은 Apple/Google의 인앱 결제 정책을 준수합니다. 환불을 원하실 경우, 개인정보 보호 및 결제 권한 보안
                정책에 따라 반드시 해당 앱 스토어(Apple 지원 또는 Google Play 고객센터)를 통해 직접 신청하셔야 합니다.
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={{ backgroundColor: isSubmitting ? THEMES[appTheme].text + "1A" : THEMES[appTheme].accent }}
            className={`w-full py-6 rounded-[30px] items-center justify-center mb-20`}
          >
            {isSubmitting ? (
              <ActivityIndicator color={THEMES[appTheme].bg} />
            ) : (
              <View className="flex-row items-center">
                <Send size={20} color={THEMES[appTheme].bg} />
                <Text style={{ color: THEMES[appTheme].bg }} className="font-bold text-lg ml-2">
                  문의하기
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SupportScreen;
