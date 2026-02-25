import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Platform,
  Modal,
  Alert,
} from "react-native";
import {
  ArrowLeft,
  CheckCircle2,
  Menu,
  ShieldCheck,
  Check,
  Briefcase,
  Smartphone,
  Shield,
  Link,
  X,
} from "lucide-react-native";
import WaveLogo from "../components/WaveLogo";
import { api } from "../services/api";
import { useUserStore } from "../store/userStore";
import { THEMES } from "../styles/theme";

/**
 * @description 회원가입 화면 (본인인증 제외, 소셜 계정 연동 중심)
 */
const RegisterScreen = ({ navigation, route }: any) => {
  const { setStatus, setUserId, setNickname, setMarketingAccepted, appTheme } = useUserStore();
  const socialData = route?.params?.socialData;

  const [step, setStep] = useState(1); // 1: Terms, 2: Social Link, 3: Basic Info
  const [formData, setFormData] = useState({
    name: socialData?.nickname || "",
    gender: "",
    agreeTerms: false,
    agreePrivacy: false,
    agreeContentUsage: false, // 콘텐츠 활용 동의 추가
    agreeMarketing: false, // 마케팅 동의 추가
    socialPlatform: socialData?.platform || "", // "kakao" or "google"
    isSocialLinked: !!socialData,
    birthYear: "",
    birthMonth: "",
    socialId: socialData?.socialId || "",
  });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [currentTerm, setCurrentTerm] = useState<{ key: string; label: string; content: string } | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const TERMS_CONTENT: { [key: string]: string } = {
    agreeTerms: `제1조 (목적)\n본 약관은 '너울'(이하 '회사')이 운영하는 익명 커뮤니티 서비스의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다...\n\n제2조 (용어의 정의)\n1. '서비스'라 함은 회사가 제공하는 '너울' 어플리케이션을 의미합니다...\n\n제3조 (이용자의 의무)\n이용자는 커뮤니티 가이드라인을 준수해야 하며, 타인에 대한 비방이나 욕설은 금지됩니다...\n\n제4조 (서비스의 제공 및 변경)\n회사는 연중무휴, 1일 24시간 서비스를 제공함을 원칙으로 합니다...\n\n제5조 (게시물의 권리)\n회원이 작성한 게시물의 저작권은 회원에게 귀속되나, 회사는 서비스 홍보를 위해 이를 사용할 수 있습니다.`,
    agreePrivacy: `1. 수집하는 개인정보 항목\n회사는 회원가입, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.\n- 수집항목: 닉네임, 성별, 생년월일, 소셜 로그인 연동 정보 등\n\n2. 개인정보의 수집 및 이용목적\n회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.\n- 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산...\n\n3. 개인정보의 보유 및 이용기간\n원칙적으로, 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.`,
    agreeContentUsage: `1. 저작권 및 사용권 위임\n이용자는 '너울'에 게시하는 모든 게시물(사연)에 대하여 회사가 이를 영리적 목적으로 재가공, 편집, 복제, 배포할 수 있는 권리를 부여합니다.\n\n2. 콘텐츠 제작\n회사는 이용자의 사연을 바탕으로 영상 콘텐츠 등을 제작할 수 있습니다. 이때 이용자의 익명성은 철저히 보장됩니다.\n\n3. 수익의 귀속\n제작된 콘텐츠를 통해 발생하는 모든 광고 수익 및 부가 수익은 회사에 귀속됩니다. 이용자는 이에 대해 어떠한 금전적 보상도 요구할 수 없음을 확인합니다.`,
    agreeMarketing: `1. 마케팅 및 광고에의 활용\n신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공, 접속 빈도 파악 또는 회원의 서비스 이용에 대한 통계 등을 목적으로 개인정보를 처리합니다.\n\n2. 동의를 거부할 권리 및 불이익\n선택 항목에 대한 동의를 거부할 수 있으며, 거부 시에도 서비스 이용은 가능하나 맞춤형 혜택 정보 안내가 제한될 수 있습니다.`,
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleNext = async () => {
    if (step === 1 && formData.isSocialLinked) {
      setStep(3); // 이미 연동된 경우 Step 2 스킵
    } else if (step < 3) {
      setStep(step + 1);
    } else {
      // 연령 확인 (만 19세 미만 가입 제한)
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const bYear = parseInt(formData.birthYear);
      const bMonth = parseInt(formData.birthMonth);

      let age = currentYear - bYear;
      if (currentMonth < bMonth) age--;

      if (age < 19) {
        setShowRejectModal(true);
        return;
      }

      // 가입 완료 시 API 호출
      const response = await api.auth.register({
        email: "user@example.com",
        nickname: formData.name,
        gender: formData.gender,
        platform: formData.socialPlatform,
        birthYear: formData.birthYear,
        birthMonth: formData.birthMonth,
        socialId: formData.socialId,
      });

      if (response.success && response.user) {
        Alert.alert("가입 완료", "회원가입이 완료되었습니다.\n로그인 화면으로 이동합니다.", [
          {
            text: "확인",
            onPress: () => navigation.navigate("Login"),
          },
        ]);
      } else {
        Alert.alert("가입 안내", response.message || "회원가입 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
      }
    }
  };

  const isStepValid = () => {
    if (step === 1) return formData.agreeTerms && formData.agreePrivacy && formData.agreeContentUsage;
    if (step === 2) return formData.isSocialLinked;
    if (step === 3) {
      const year = parseInt(formData.birthYear);
      const month = parseInt(formData.birthMonth);
      return (
        formData.name.trim().length >= 2 &&
        formData.gender !== "" &&
        year >= 1900 &&
        year <= new Date().getFullYear() &&
        month >= 1 &&
        month <= 12
      );
    }
    return false;
  };

  return (
    <SafeAreaView style={{ backgroundColor: THEMES[appTheme].bg }} className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="px-8 py-10">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-12">
            <TouchableOpacity
              onPress={handleBack}
              style={{ backgroundColor: THEMES[appTheme].surface + "99", borderColor: THEMES[appTheme].text + "0D" }}
              className="w-12 h-12 rounded-2xl items-center justify-center border"
            >
              <ArrowLeft size={24} color={THEMES[appTheme].text} />
            </TouchableOpacity>
            <Text
              style={{ color: THEMES[appTheme].text }}
              className="opacity-40 text-xs font-bold tracking-widest uppercase"
            >
              Step {step} of 3
            </Text>
            <View className="w-12 h-12" />
          </View>

          {/* Branding */}
          <View className="items-center mb-16">
            <View
              style={{ backgroundColor: THEMES[appTheme].accent + "1A" }}
              className="w-24 h-24 rounded-[32px] items-center justify-center border border-white/5 shadow-2xl mb-8"
            >
              <WaveLogo size={52} color={THEMES[appTheme].accent} />
            </View>
            <Text style={{ color: THEMES[appTheme].text }} className="text-3xl font-black tracking-tight">
              너울 회원가입
            </Text>
          </View>

          {step === 1 ? (
            <View>
              <Text style={{ color: THEMES[appTheme].text }} className="text-2xl font-bold mb-8">
                너울의 물결에{"\n"}합류하기 위한 약관동의
              </Text>

              <View
                style={{ backgroundColor: THEMES[appTheme].surface + "66", borderColor: THEMES[appTheme].text + "0D" }}
                className="p-6 rounded-3xl border mb-8"
              >
                <Text style={{ color: THEMES[appTheme].text }} className="opacity-60 text-xs leading-5">
                  너울은 성인 전용 익명 커뮤니티로, 쾌적한 환경 유지를 위해 기본 약관 및 커뮤니티 가이드라인 준수가
                  필수입니다.
                </Text>
              </View>

              <View className="space-y-4">
                {[
                  { key: "agreeTerms", label: "[필수] 이용약관 동의" },
                  { key: "agreePrivacy", label: "[필수] 개인정보 수집 및 이용 동의" },
                  { key: "agreeContentUsage", label: "[필수] 콘텐츠 활용 동의" },
                  { key: "agreeMarketing", label: "[선택] 마케팅 정보 수신 동의" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => {
                      if (formData[item.key as keyof typeof formData]) {
                        setFormData({ ...formData, [item.key]: false });
                      } else {
                        setCurrentTerm({ key: item.key, label: item.label, content: TERMS_CONTENT[item.key] });
                        setHasScrolledToBottom(true);
                        setShowTermsModal(true);
                      }
                    }}
                    style={{
                      backgroundColor: formData[item.key as keyof typeof formData]
                        ? THEMES[appTheme].accent + "1A"
                        : THEMES[appTheme].surface + "66",
                      borderColor: formData[item.key as keyof typeof formData]
                        ? THEMES[appTheme].accent
                        : THEMES[appTheme].text + "0D",
                    }}
                    className="flex-row items-center p-6 rounded-2xl border mb-4"
                  >
                    <View
                      style={{
                        backgroundColor: formData[item.key as keyof typeof formData]
                          ? THEMES[appTheme].accent
                          : "transparent",
                        borderColor: formData[item.key as keyof typeof formData]
                          ? THEMES[appTheme].accent
                          : THEMES[appTheme].text + "33",
                      }}
                      className={`w-6 h-6 rounded-full items-center justify-center mr-4 ${!formData[item.key as keyof typeof formData] ? "border" : ""}`}
                    >
                      {formData[item.key as keyof typeof formData] && <Check size={14} color={THEMES[appTheme].bg} />}
                    </View>
                    <Text style={{ color: THEMES[appTheme].text }} className="flex-1">
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : step === 2 ? (
            <View>
              <Text style={{ color: THEMES[appTheme].text }} className="text-2xl font-bold mb-8">
                연동할 소셜 계정을{"\n"}선택해 주세요.
              </Text>

              <View className="space-y-4">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setFormData({ ...formData, socialPlatform: "kakao", isSocialLinked: true });
                    setTimeout(() => setStep(3), 600);
                  }}
                  style={{
                    backgroundColor: formData.socialPlatform === "kakao" ? "#FEE500" : THEMES[appTheme].surface + "99",
                    borderColor: formData.socialPlatform === "kakao" ? "#FEE500" : THEMES[appTheme].text + "1A",
                  }}
                  className="flex-row items-center px-6 h-[72px] rounded-[28px] border mb-6"
                >
                  <View className="w-10 h-10 bg-black/5 rounded-full items-center justify-center mr-4">
                    <Link size={20} color={formData.socialPlatform === "kakao" ? "#191919" : THEMES[appTheme].accent} />
                  </View>
                  <Text
                    style={{ color: formData.socialPlatform === "kakao" ? "#191919" : THEMES[appTheme].text }}
                    className="font-bold text-lg flex-1"
                  >
                    카카오계정 연동하기
                  </Text>
                  {formData.socialPlatform === "kakao" && <CheckCircle2 size={24} color="#191919" />}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setFormData({ ...formData, socialPlatform: "google", isSocialLinked: true });
                    setTimeout(() => setStep(3), 600);
                  }}
                  style={{
                    backgroundColor: formData.socialPlatform === "google" ? "white" : THEMES[appTheme].surface + "99",
                    borderColor: formData.socialPlatform === "google" ? "white" : THEMES[appTheme].text + "1A",
                  }}
                  className="flex-row items-center px-6 h-[72px] rounded-[28px] border"
                >
                  <View className="w-10 h-10 bg-black/5 rounded-full items-center justify-center mr-4">
                    <Link
                      size={20}
                      color={formData.socialPlatform === "google" ? "#191919" : THEMES[appTheme].accent}
                    />
                  </View>
                  <Text
                    style={{ color: formData.socialPlatform === "google" ? "#191919" : THEMES[appTheme].text }}
                    className="font-bold text-lg flex-1"
                  >
                    Google계정 연동하기
                  </Text>
                  {formData.socialPlatform === "google" && <CheckCircle2 size={24} color="#191919" />}
                </TouchableOpacity>
              </View>

              <Text style={{ color: THEMES[appTheme].text }} className="opacity-30 text-xs mt-8 px-2 leading-5">
                * 별도의 비밀번호 없이 소셜 계정으로 안전하게 로그인할 수 있습니다.
              </Text>
            </View>
          ) : (
            <View>
              <Text style={{ color: THEMES[appTheme].text }} className="text-2xl font-bold mb-8">
                기본 정보를{"\n"}완성해 주세요.
              </Text>

              <View className="space-y-6">
                <View className="mb-6">
                  <Text style={{ color: THEMES[appTheme].text }} className="opacity-40 text-xs font-bold mb-2 ml-1">
                    NICKNAME (실명 권장)
                  </Text>
                  <TextInput
                    placeholder="이름 또는 닉네임"
                    placeholderTextColor={THEMES[appTheme].text + "33"}
                    style={{
                      backgroundColor: THEMES[appTheme].surface + "66",
                      color: THEMES[appTheme].text,
                      borderColor: THEMES[appTheme].text + "0D",
                    }}
                    className="h-16 rounded-2xl px-6 border"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>

                <View>
                  <Text style={{ color: THEMES[appTheme].text }} className="opacity-40 text-xs font-bold mb-2 ml-1">
                    GENDER
                  </Text>
                  <View className="flex-row space-x-4 mb-10">
                    {["남성", "여성"].map((g) => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => setFormData({ ...formData, gender: g })}
                        style={{
                          backgroundColor:
                            formData.gender === g ? THEMES[appTheme].accent : THEMES[appTheme].surface + "66",
                          borderColor: formData.gender === g ? THEMES[appTheme].accent : THEMES[appTheme].text + "0D",
                        }}
                        className={`flex-1 h-16 rounded-2xl items-center justify-center border ${g === "남성" ? "mr-4" : ""}`}
                      >
                        <Text
                          style={{ color: formData.gender === g ? THEMES[appTheme].bg : THEMES[appTheme].text }}
                          className="font-bold text-base"
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Birth Date Section Added */}
                <View className="space-y-6">
                  <View>
                    <Text style={{ color: THEMES[appTheme].text }} className="opacity-40 text-xs font-bold mb-2 ml-1">
                      BIRTH DATE (연령 확인용)
                    </Text>
                    <View className="flex-row items-center space-x-4">
                      <View
                        style={{
                          backgroundColor: THEMES[appTheme].surface + "66",
                          borderColor: THEMES[appTheme].text + "0D",
                        }}
                        className="flex-1 flex-row items-center h-16 rounded-2xl px-6 border mr-4"
                      >
                        <TextInput
                          placeholder="연도 (4자리)"
                          placeholderTextColor={THEMES[appTheme].text + "33"}
                          style={{ color: THEMES[appTheme].text, flex: 1 }}
                          keyboardType="number-pad"
                          maxLength={4}
                          value={formData.birthYear}
                          onChangeText={(text) => setFormData({ ...formData, birthYear: text })}
                        />
                        <Text style={{ color: THEMES[appTheme].text }} className="opacity-30 font-bold ml-2">
                          년
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: THEMES[appTheme].surface + "66",
                          borderColor: THEMES[appTheme].text + "0D",
                        }}
                        className="flex-1 flex-row items-center h-16 rounded-2xl px-6 border"
                      >
                        <TextInput
                          placeholder="월"
                          placeholderTextColor={THEMES[appTheme].text + "33"}
                          style={{ color: THEMES[appTheme].text, flex: 1 }}
                          keyboardType="number-pad"
                          maxLength={2}
                          value={formData.birthMonth}
                          onChangeText={(text) => setFormData({ ...formData, birthMonth: text })}
                        />
                        <Text style={{ color: THEMES[appTheme].text }} className="opacity-30 font-bold ml-2">
                          월
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: THEMES[appTheme].text }} className="opacity-20 text-[10px] mt-3 px-1">
                      * 너울은 만 19세 이상의 성인만 이용 가능한 서비스입니다.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Rejection Modal */}
        <Modal visible={showRejectModal} transparent={true} animationType="fade">
          <View className="flex-1 items-center justify-center bg-black/80 px-8">
            <View
              style={{ backgroundColor: THEMES[appTheme].surface }}
              className="w-full p-10 rounded-[40px] border border-white/10 items-center shadow-2xl"
            >
              <View className="w-20 h-20 bg-red-500/10 rounded-full items-center justify-center mb-8">
                <ShieldCheck size={40} color="#EF4444" />
              </View>
              <Text style={{ color: THEMES[appTheme].text }} className="text-2xl font-bold mb-4 text-center">
                서비스 이용 불가
              </Text>
              <Text
                style={{ color: THEMES[appTheme].text }}
                className="opacity-60 text-center leading-7 mb-10 text-base"
              >
                죄송합니다. 너울은 만 19세 이상의{"\n"}성인만 이용 가능한 커뮤니티입니다.{"\n"}연령 조건을 충족할 때
                다시 찾아주세요.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowRejectModal(false);
                  navigation.replace("Login");
                }}
                style={{ backgroundColor: THEMES[appTheme].accent }}
                className="w-full h-16 rounded-2xl items-center justify-center"
              >
                <Text style={{ color: THEMES[appTheme].bg }} className="text-lg font-bold">
                  확인
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Terms Detail Modal */}
        <Modal visible={showTermsModal} transparent={true} animationType="slide">
          <View style={{ backgroundColor: THEMES[appTheme].bg + "F2" }} className="flex-1 pt-24">
            <View
              style={{ backgroundColor: THEMES[appTheme].surface }}
              className="flex-1 rounded-t-[40px] border-t border-white/10"
            >
              <View className="px-8 py-8 flex-row justify-between items-center mb-6">
                <Text style={{ color: THEMES[appTheme].text }} className="text-xl font-bold">
                  {currentTerm?.label}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTermsModal(false)}
                  style={{ backgroundColor: THEMES[appTheme].text + "1A" }}
                  className="w-10 h-10 rounded-full items-center justify-center"
                >
                  <X size={24} color={THEMES[appTheme].text} opacity={0.3} />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="flex-1 px-8"
                showsVerticalScrollIndicator={true}
                onScroll={({ nativeEvent }: any) => {
                  const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                  const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 30;
                  if (isBottom) setHasScrolledToBottom(true);
                }}
                scrollEventThrottle={400}
              >
                <Text style={{ color: THEMES[appTheme].text }} className="leading-7 opacity-60 text-sm mb-20">
                  {currentTerm?.content}
                </Text>
              </ScrollView>

              <View className="p-8 border-t border-white/5 bg-black/20">
                <TouchableOpacity
                  disabled={!hasScrolledToBottom}
                  onPress={() => {
                    if (currentTerm) {
                      setFormData({ ...formData, [currentTerm.key]: true });
                    }
                    setShowTermsModal(false);
                  }}
                  style={{
                    backgroundColor: hasScrolledToBottom ? THEMES[appTheme].accent : THEMES[appTheme].surface,
                    opacity: hasScrolledToBottom ? 1 : 0.5,
                  }}
                  className="w-full h-16 rounded-2xl items-center justify-center"
                >
                  <Text
                    style={{ color: hasScrolledToBottom ? THEMES[appTheme].bg : THEMES[appTheme].text }}
                    className="text-lg font-bold"
                  >
                    확인 및 동의하기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Footer Button */}
        <View className="px-8 pb-12 mt-auto">
          {step === 3 && (
            <Text
              style={{ color: THEMES[appTheme].text }}
              className="text-[10px] opacity-30 text-center mb-6 leading-4"
            >
              * 가입 시 작성하신 사연이 익명화를 거쳐 유튜브 콘텐츠로 제작될 수 있으며,{"\n"}이를 통한 수익은 회사에
              귀속됨에 동의하는 것으로 간주합니다.
            </Text>
          )}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNext}
            disabled={!isStepValid()}
            style={{ backgroundColor: isStepValid() ? THEMES[appTheme].accent : THEMES[appTheme].surface }}
            className={`h-[68px] rounded-[30px] items-center justify-center shadow-2xl ${
              !isStepValid() ? "opacity-50" : ""
            }`}
          >
            <Text style={{ color: THEMES[appTheme].bg }} className="text-xl font-bold">
              {step === 3 ? "너울 시작하기" : "다음 단계로"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
