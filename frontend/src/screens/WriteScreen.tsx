import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft, Send, Hash, AlertCircle, ShieldAlert, Sparkles, Check } from "lucide-react-native";
import { Modal } from "react-native";
import { api } from "../services/api";
import { useUserStore } from "../store/userStore";
import { THEMES } from "../styles/theme";
import Animated, { FadeInUp } from "react-native-reanimated";

const CATEGORIES = ["고민", "일상", "위로", "질문"];

/**
 * @description 텍스트 게시글 작성 화면
 */
const WriteScreen = ({ navigation }: any) => {
  const {
    status: userStatus,
    userId,
    nickname,
    lastGuidelineDate,
    setGuidelineSeen,
    penalty,
    appTheme,
  } = useUserStore();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("일상");
  const [isPosting, setIsPosting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  React.useEffect(() => {
    let shouldShow = true;
    if (lastGuidelineDate) {
      const lastDate = new Date(lastGuidelineDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 30) {
        shouldShow = false;
      }
    }
    setShowGuide(shouldShow);
  }, [lastGuidelineDate]);

  const handleGuideConfirm = () => {
    if (dontShowAgain) {
      setGuidelineSeen();
    }
    setShowGuide(false);
  };

  // AI 요약 관련 상태
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAISummary] = useState<string | null>(null);

  const handleAISummary = async () => {
    if (userStatus !== "VIP") {
      Alert.alert("VIP 전용", "AI 요약 기능은 VIP 회원만 이용 가능합니다.");
      return;
    }

    if (!content.trim()) {
      Alert.alert("내용 없음", "먼저 내용을 입력해 주세요.");
      return;
    }

    try {
      setIsSummarizing(true);
      const data = await api.stt.summarize(content);

      if (data.success) {
        setAISummary(data.summary);
      } else {
        throw new Error("API failed");
      }
    } catch (error) {
      Alert.alert("오류", "AI 요약 서비스를 일시적으로 사용할 수 없습니다.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handlePost = async () => {
    // 제재 상태 확인
    if (penalty.level >= 2) {
      const remainingTime = penalty.expiresAt
        ? Math.ceil((new Date(penalty.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))
        : 0;
      Alert.alert(
        "작성 제한",
        `부적절한 활동으로 인해 작성이 제한되었습니다.\n남은 시간: 약 ${remainingTime}시간\n사유: ${penalty.reason}`,
      );
      return;
    }

    if (penalty.level === 1) {
      Alert.alert(
        "주의 알림",
        `과거 부적절한 활동으로 인해 주의 상태입니다. 다시 신고될 경우 작성이 제한될 수 있습니다.\n사유: ${penalty.reason}`,
      );
    }

    // 내용이 없으면 중단
    if (!content.trim()) {
      Alert.alert("입력 오류", "내용을 입력해 주세요.");
      return;
    }

    // 제목이 없으면 내용의 첫 줄을 제목으로 사용
    const finalTitle = title.trim() || content.trim().split("\n")[0].substring(0, 40);

    try {
      setIsPosting(true);

      // 1. 콘텐츠 필터링 체크 (FastAPI 필터링 서버 연동)
      const filterRes = await api.posts.filter(content);

      if (filterRes.is_blocked) {
        Alert.alert("작성 제한", filterRes.message || "부적절한 내용이 포함되어 있습니다.");
        setIsPosting(false);
        return;
      }

      if (filterRes.action === "warn") {
        const proceed = await new Promise((resolve) => {
          Alert.alert("작성 가이드", filterRes.message, [
            { text: "수정하기", onPress: () => resolve(false), style: "cancel" },
            { text: "그대로 올리기", onPress: () => resolve(true) },
          ]);
        });
        if (!proceed) {
          setIsPosting(false);
          return;
        }
      }

      // 2. 게시글 작성 (실제 백엔드 규격에 맞춤)
      await api.posts.create({
        content: finalTitle ? `[${finalTitle}]\n${content}` : content,
        userId: userId || "anonymous",
        nickname: nickname || "익명의 너울",
        hasVote: false,
      });
      Alert.alert("성공", "이야기가 너울에 담겼습니다.");
      navigation.navigate("Home");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "게시글 작성에 실패했습니다.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: THEMES[appTheme].bg }} className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        {/* Header */}
        <View className="px-6 py-6 flex-row justify-between items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center">
            <ArrowLeft size={28} color={THEMES[appTheme].text} />
          </TouchableOpacity>

          <Text style={{ color: THEMES[appTheme].text }} className="text-xl font-bold">
            이야기 담기
          </Text>

          <TouchableOpacity
            onPress={handlePost}
            disabled={!content.trim() || isPosting}
            className={`w-10 h-10 items-center justify-center ${!content.trim() || isPosting ? "opacity-30" : ""}`}
          >
            {isPosting ? (
              <ActivityIndicator color={THEMES[appTheme].accent} size="small" />
            ) : (
              <Send size={24} color={THEMES[appTheme].accent} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Category Selector */}
          <View className="mb-6">
            <Text className="text-[#E0E0E0]/40 text-xs font-bold mb-3 tracking-widest">CATEGORY</Text>
            <View className="flex-row flex-wrap">
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full mr-2 mb-2 border ${
                    selectedCategory === cat ? "" : "border-white/5"
                  }`}
                  style={{
                    backgroundColor:
                      selectedCategory === cat ? THEMES[appTheme].accent : THEMES[appTheme].surface + "66",
                    borderColor: selectedCategory === cat ? THEMES[appTheme].accent : "rgba(255,255,255,0.05)",
                  }}
                >
                  <Text
                    className={`font-bold text-xs`}
                    style={{ color: selectedCategory === cat ? THEMES[appTheme].bg : THEMES[appTheme].text + "99" }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title Input Area */}
          <View className="mb-5">
            <Text className="text-[#E0E0E0]/40 text-xs font-bold mb-3 tracking-widest">TITLE</Text>
            <View
              style={{ backgroundColor: THEMES[appTheme].surface + "33" }}
              className="rounded-[20px] p-5 border border-white/5"
            >
              <TextInput
                placeholder="제목을 입력해 주세요"
                placeholderTextColor="#E0E0E020"
                className="text-[#E0E0E0] text-lg font-bold"
                value={title}
                onChangeText={setTitle}
                maxLength={40}
              />
            </View>
          </View>

          {/* Text Input Area */}
          <View
            style={{ backgroundColor: THEMES[appTheme].surface + "33" }}
            className="rounded-[40px] p-8 border border-white/5 min-h-[250px]"
          >
            <Text className="text-[#E0E0E0]/40 text-xs font-bold mb-4 tracking-widest uppercase">Content</Text>
            <TextInput
              multiline
              placeholder="지금 당신의 마음속에 어떤 파도가 일고 있나요?"
              placeholderTextColor="#E0E0E020"
              className="text-[#E0E0E0] text-lg leading-8"
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
              autoFocus
            />
          </View>

          {/* AI Tools for VIP */}
          {userStatus === "VIP" && (
            <View className="mt-6">
              <TouchableOpacity
                onPress={handleAISummary}
                disabled={isSummarizing || !content.trim()}
                style={{ backgroundColor: THEMES[appTheme].accent + "0D", borderColor: THEMES[appTheme].accent + "33" }}
                className={`flex-row items-center justify-center py-4 rounded-3xl border ${
                  isSummarizing ? "bg-white/5" : ""
                }`}
              >
                {isSummarizing ? (
                  <ActivityIndicator size="small" color={THEMES[appTheme].accent} />
                ) : (
                  <>
                    <Sparkles size={18} color={THEMES[appTheme].accent} />
                    <Text style={{ color: THEMES[appTheme].accent }} className="font-bold ml-2">
                      AI로 내용 요약하기
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {aiSummary && (
                <Animated.View
                  entering={FadeInUp}
                  className="mt-4 p-6 bg-[#002845]/40 rounded-[30px] border border-[#00E0D0]/10"
                >
                  <View className="flex-row items-center mb-3">
                    <Sparkles size={14} color="#00E0D0" opacity={0.6} />
                    <Text className="text-[#00E0D0]/60 text-xs font-bold ml-2">AI 프리뷰 요약</Text>
                  </View>
                  <Text className="text-[#E0E0E0] text-[14px] leading-6 font-light">{aiSummary}</Text>
                </Animated.View>
              )}
            </View>
          )}

          {/* Tips/Notice */}
          <View className="mt-8 flex-row items-start px-4 opacity-40 mb-10">
            <Hash size={14} color="#E0E0E0" style={{ marginTop: 4 }} />
            <Text className="text-[#E0E0E0] text-xs leading-5 ml-2 flex-1">
              익명으로 작성되며, 정성껏 작성된 파도는 누군가에게 따뜻한 위로가 됩니다. 작성된 내용은 Noul 익명
              콘텐츠(유튜브 등) 제작에 활용될 수 있으며, 작성 시 이에 동의한 것으로 간주됩니다.
            </Text>
          </View>
        </ScrollView>

        {/* Community Guidelines Modal */}
        <Modal visible={showGuide} transparent={true} animationType="fade" onRequestClose={() => setShowGuide(false)}>
          <View className="flex-1 bg-black/80 items-center justify-center p-8">
            <View
              style={{ backgroundColor: THEMES[appTheme].surface }}
              className="p-10 rounded-[40px] border border-white/10 w-full items-center"
            >
              <View
                style={{ backgroundColor: THEMES[appTheme].accent + "11" }}
                className="w-16 h-16 rounded-full items-center justify-center mb-6"
              >
                <ShieldAlert size={32} color={THEMES[appTheme].accent} />
              </View>
              <Text className="text-[#E0E0E0] text-xl font-bold mb-4 text-center">커뮤니티 가이드라인</Text>
              <Text className="text-[#E0E0E0]/60 text-center leading-7 mb-8 text-sm">
                너울은 모두가 편안하게 속마음을{"\n"}나눌 수 있는 공간입니다.{"\n\n"}
                <Text className="text-[#00E0D0]">• 비방, 욕설, 타인에 대한 공격 금지{"\n"}</Text>
                <Text className="text-[#00E0D0]">• 음란물 및 상업적 광고 게시 금지{"\n"}</Text>
                <Text className="text-[#00E0D0]">• 개인정보 유출 주의</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setDontShowAgain(!dontShowAgain)}
                className="flex-row items-center mb-8 self-start ml-2"
              >
                <View
                  className={`w-6 h-6 rounded-lg items-center justify-center border ${
                    dontShowAgain ? "bg-[#00E0D0] border-[#00E0D0]" : "border-white/20"
                  }`}
                >
                  {dontShowAgain && <Check size={16} color="#001220" />}
                </View>
                <Text className="text-[#E0E0E0]/40 text-xs ml-3">30일 동안 보지 않기</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleGuideConfirm}
                className="bg-[#00E0D0] py-4 px-10 rounded-2xl w-full items-center"
              >
                <Text className="text-[#001220] font-bold">확인했습니다</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WriteScreen;
