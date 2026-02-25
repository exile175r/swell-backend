import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import Waveform from "../components/Waveform";
import { Modal } from "react-native";
import { api } from "../services/api";
import { useUserStore } from "../store/userStore";
import { THEMES } from "../styles/theme";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useGlobalLoader } from "../hooks/useGlobalLoader";
import {
  Mic,
  Square,
  ArrowLeft,
  Menu,
  AlertTriangle,
  ShieldCheck,
  Send,
  ShieldAlert,
  Settings,
  Sparkles,
  Check,
} from "lucide-react-native";

/**
 * @description STT 입력 화면 (Midnight Calm 테마 적용)
 */
const STTScreen = ({ navigation }: any) => {
  const {
    status: userStatus,
    userId,
    nickname,
    lastGuidelineDate,
    setGuidelineSeen,
    penalty,
    appTheme,
  } = useUserStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [title, setTitle] = useState("");
  const [recognizedText, setRecognizedText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("일상");
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
  const [micPermission, setMicPermission] = useState<"granted" | "denied" | "undetermined">("granted");
  const { startLoadingNow, stopLoading } = useGlobalLoader();

  // AI 요약 관련 상태
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAISummary] = useState<string | null>(null);

  const handleAISummary = async () => {
    if (userStatus !== "VIP") {
      Alert.alert("VIP 전용", "AI 요약 기능은 VIP 회원만 이용 가능합니다.");
      return;
    }

    if (!recognizedText.trim()) {
      Alert.alert("내용 없음", "먼저 음성을 인식시켜 주세요.");
      return;
    }

    try {
      setIsSummarizing(true);
      const data = await api.stt.summarize(recognizedText);

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

  const CATEGORIES = ["고민", "일상", "위로", "질문"];

  const [transcriptionTimer, setTranscriptionTimer] = useState<NodeJS.Timeout | null>(null);

  const toggleRecording = async () => {
    if (micPermission !== "granted") {
      Alert.alert("마이크 권한 필요", "설정에서 마이크 권한을 허용해 주세요.", [
        { text: "취소", style: "cancel" },
        { text: "허용", onPress: () => setMicPermission("granted") },
      ]);
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      if (transcriptionTimer) clearInterval(transcriptionTimer);

      try {
        startLoadingNow(); // 음성 분석 시작 시 전역 로딩 즉시 노출
        const result = await api.stt.recognize();
        const textResult =
          result.text ||
          recognizedText ||
          "오늘 하루는 정말 긴 파도 같았어요. 하지만 그 끝에는 고요함이 기다리고 있겠죠.";
        setRecognizedText(textResult);
        setIsReviewing(true);
      } catch (error) {
        console.error("STT Error:", error);
        if (!recognizedText) {
          setRecognizedText("오늘 하루는 정말 긴 파도 같았어요. 하지만 그 끝에는 고요함이 기다리고 있겠죠.");
        }
        setIsReviewing(true);
      } finally {
        stopLoading(); // 분석 완료 후 로딩 종료
      }
    } else {
      setIsRecording(true);
      setIsReviewing(false);
      setTitle(""); // 새 녹음 시 제목 초기화
      setRecognizedText("");

      // 실시간 시각화 고도화 시뮬레이션
      const dummyWords = [
        "지금",
        "보내는",
        "당신의",
        "진심 어린",
        "이야기가",
        "푸른",
        "너울을",
        "타고",
        "누군가의",
        "마음에",
        "닿기를",
        "바랍니다.",
      ];
      let fullText = "";
      let index = 0;

      const timer = setInterval(() => {
        if (index < dummyWords.length) {
          fullText += (fullText ? " " : "") + dummyWords[index];
          setRecognizedText(fullText);
          index++;
        }
      }, 700);
      setTranscriptionTimer(timer);
    }
  };

  const handlePost = async () => {
    // 텍스트가 없으면 중단
    if (!recognizedText.trim() || isPosting) {
      Alert.alert("입력 오류", "음성 인식된 내용이 없습니다.");
      return;
    }

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

    // 제목이 없으면 내용의 첫 줄을 제목으로 사용
    const finalTitle = title.trim() || recognizedText.trim().split("\n")[0].substring(0, 40);

    try {
      setIsPosting(true);

      // 1. 콘텐츠 필터링 체크 (FastAPI 필터링 서버 연동)
      const filterRes = await api.posts.filter(recognizedText);

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

      // 2. 게시글 작성
      await api.posts.create({
        title: finalTitle,
        content: recognizedText,
        userId: userId || "anonymous",
        nickname: nickname || "익명의 너울",
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
              목소리로 담은 당신의 진심이{"\n"}상처가 되지 않도록 주의해 주세요.{"\n\n"}
              <Text className="text-[#00E0D0]">• 타인을 비방하거나 공격하는 언어 자제{"\n"}</Text>
              <Text className="text-[#00E0D0]">• 감정을 쏟아낸 후 내용을 가다듬어 보기</Text>
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

      {/* I-Message Guide Modal removed as per user request for no filtering */}

      {/* Header */}
      <View className="px-6 py-6 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={28} color={THEMES[appTheme].text} />
        </TouchableOpacity>

        <Text style={{ color: THEMES[appTheme].text }} className="text-xl font-bold">
          {isReviewing ? "이야기 다듬기" : "목소리 담기"}
        </Text>

        <TouchableOpacity
          onPress={isReviewing ? handlePost : () => {}}
          disabled={(isReviewing && !recognizedText.trim()) || isPosting}
          className="w-10 h-10 items-center justify-center"
        >
          {isReviewing ? (
            isPosting ? (
              <ActivityIndicator color={THEMES[appTheme].accent} size="small" />
            ) : (
              <Send size={24} color={THEMES[appTheme].accent} style={{ opacity: !recognizedText.trim() ? 0.3 : 1 }} />
            )
          ) : (
            <Menu size={28} color={THEMES[appTheme].text} />
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {!isReviewing ? (
          <View className="flex-1 justify-between py-12">
            {/* Recording State UI */}
            <View className="px-6 items-center">
              <View
                style={{ backgroundColor: THEMES[appTheme].surface + "4D" }}
                className="px-5 py-1.5 rounded-full border border-white/5 mb-8 flex-row items-center"
              >
                {isRecording && (
                  <Animated.View
                    entering={FadeInUp}
                    className="w-2 h-2 rounded-full bg-[#E7433C] mr-2"
                    style={{ opacity: 0.8 }}
                  />
                )}
                <Text style={{ color: THEMES[appTheme].accent }} className="text-[10px] font-bold tracking-[3px]">
                  {isRecording ? "RECORDING NOW" : "VOICE ARCHIVE"}
                </Text>
              </View>

              <View className="min-h-[120px] justify-center w-full">
                <Text
                  className={`text-2xl text-center leading-[38px] font-light px-4`}
                  style={{ color: isRecording ? THEMES[appTheme].accent : THEMES[appTheme].text }}
                >
                  {isRecording
                    ? recognizedText || "당신의 목소리를 기다리고 있어요..."
                    : "오늘 당신의 감정은\n어떤 이름을 가지고 있나요?"}
                </Text>
              </View>

              {isRecording && (
                <View className="mt-12 items-center">
                  <View style={{ opacity: 0.4 }}>
                    <ActivityIndicator size="small" color={THEMES[appTheme].accent} />
                  </View>
                  <Text className="text-[#00E0D0]/40 text-[10px] font-bold mt-3 tracking-widest uppercase">
                    Transcribing your voice in real-time
                  </Text>
                </View>
              )}
            </View>

            <View className="h-48 justify-center">
              <Waveform isRecording={isRecording} />
            </View>

            <View className="items-center pb-12">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={toggleRecording}
                className={`w-20 h-20 rounded-[30px] items-center justify-center shadow-2xl`}
                style={[
                  { backgroundColor: isRecording ? "#E7433C" : THEMES[appTheme].accent },
                  !isRecording &&
                    Platform.select({
                      ios: { shadowColor: THEMES[appTheme].accent, shadowOpacity: 0.5, shadowRadius: 20 },
                      android: { elevation: 12 },
                      web: { boxShadow: `0px 0px 20px ${THEMES[appTheme].accent}80` },
                    }),
                ]}
              >
                {isRecording ? (
                  <Square size={30} color="white" fill="white" />
                ) : (
                  <Mic size={30} color={THEMES[appTheme].bg} />
                )}
              </TouchableOpacity>
              <Text className="text-[#E0E0E0]/40 mt-6 font-bold tracking-[1px] text-xs">
                {isRecording ? "TAP TO FINISH" : "TAP TO RECORD"}
              </Text>

              {!isRecording && (
                <View className="flex-row items-center mt-12 opacity-30">
                  <ShieldCheck size={12} color="#E0E0E0" />
                  <Text className="text-[#E0E0E0] text-[10px] ml-2 font-medium">
                    이 파도는 24시간 후 모래사장으로 흩어집니다 (자동 삭제)
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View className="px-8 pt-4 pb-20">
            {/* Review State UI (Same as WriteScreen) */}
            <View className="mb-8">
              <Text className="text-[#E0E0E0]/40 text-xs font-bold mb-4 tracking-widest">CATEGORY</Text>
              <View className="flex-row flex-wrap">
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-full mr-3 mb-3 border`}
                    style={{
                      backgroundColor:
                        selectedCategory === cat ? THEMES[appTheme].accent : THEMES[appTheme].surface + "66",
                      borderColor: selectedCategory === cat ? THEMES[appTheme].accent : "rgba(255,255,255,0.05)",
                    }}
                  >
                    <Text
                      className={`font-bold text-xs`}
                      style={{ color: selectedCategory === cat ? THEMES[appTheme].bg : "#E0E0E099" }}
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

            <View
              style={{ backgroundColor: THEMES[appTheme].surface + "33" }}
              className="rounded-[32px] p-6 border border-white/5 min-h-[220px]"
            >
              <Text className="text-[#E0E0E0]/40 text-xs font-bold mb-3 tracking-widest uppercase">Content</Text>
              <TextInput
                multiline
                placeholder="목소리가 텍스트로 변환되었습니다. 내용을 다듬어보세요."
                placeholderTextColor="#E0E0E020"
                className="text-[#E0E0E0] text-[16px] leading-7"
                value={recognizedText}
                onChangeText={setRecognizedText}
                textAlignVertical="top"
              />
            </View>

            {/* AI Tools for VIP */}
            {userStatus === "VIP" && (
              <View className="mt-6">
                <TouchableOpacity
                  onPress={handleAISummary}
                  disabled={isSummarizing || !recognizedText.trim()}
                  className={`flex-row items-center justify-center py-4 rounded-3xl border border-[#00E0D0]/20 ${
                    isSummarizing ? "bg-white/5" : "bg-[#00E0D0]/5"
                  }`}
                >
                  {isSummarizing ? (
                    <ActivityIndicator size="small" color="#00E0D0" />
                  ) : (
                    <>
                      <Sparkles size={18} color="#00E0D0" />
                      <Text className="text-[#00E0D0] font-bold ml-2">AI로 내용 요약하기</Text>
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

            <TouchableOpacity
              onPress={() => {
                setIsReviewing(false);
                setAISummary(null);
              }}
              className="mt-8 self-center items-center"
            >
              <Text className="text-[#00E0D0] text-sm font-bold border-b border-[#001220] mb-2">
                원하는 대로 내용을 직접 수정할 수 있습니다.
              </Text>
              <Text className="text-[#00E0D0] text-xs font-medium border-b border-[#00E0D0]">다시 녹음하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default STTScreen;
