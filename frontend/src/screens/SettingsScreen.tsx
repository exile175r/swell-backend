import React, { useState } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Switch, Alert, Platform, Modal } from "react-native";
import {
  ArrowLeft,
  Bell,
  EyeOff,
  Database,
  Info,
  LogOut,
  ChevronRight,
  Trash2,
  X,
  UserX,
  ShieldAlert,
  ShieldCheck,
  Palette,
  Lock,
  BookOpen,
} from "lucide-react-native";

import { useUserStore } from "../store/userStore";
import { THEMES } from "../styles/theme";
import { api } from "../services/api";

/**
 * @description 환경 설정 화면
 */
const SettingsScreen = ({ navigation }: any) => {
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showUsageGuideModal, setShowUsageGuideModal] = useState(false); // 이용 안내 모달 상태로 변경
  const {
    userId,
    blockedUsers,
    unblockUser,
    resetStore,
    appTheme,
    setAppTheme,
    notificationsEnabled,
    setNotificationsEnabled,
    isSecretModeActive,
    appPassword,
    setSecretMode,
    setAppPassword,
  } = useUserStore();

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [tempTheme, setTempTheme] = useState(appTheme);

  // 시크릿 모드 관련 상태 추가
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordMode, setPasswordMode] = useState<"activate" | "deactivate" | "change">("activate");
  const [passwordStep, setPasswordStep] = useState(1);
  const [pinBuffer, setPinBuffer] = useState("");
  const [firstPin, setFirstPin] = useState("");

  const handlePINPress = (num: string) => {
    if (pinBuffer.length < 4) {
      const nextPin = pinBuffer + num;
      setPinBuffer(nextPin);

      if (nextPin.length === 4) {
        processPIN(nextPin);
      }
    }
  };

  const processPIN = (pin: string) => {
    if (passwordMode === "activate") {
      if (passwordStep === 1) {
        setFirstPin(pin);
        setPasswordStep(2);
        setPinBuffer("");
      } else {
        if (pin === firstPin) {
          setAppPassword(pin);
          setSecretMode(true);
          setShowPasswordModal(false);
          Alert.alert("성공", "시크릿 모드가 활성화되었습니다.");
        } else {
          Alert.alert("오류", "비밀번호가 일치하지 않습니다. 다시 시도해주세요.");
          resetPINFlow();
        }
      }
    } else if (passwordMode === "deactivate") {
      if (pin === appPassword) {
        setSecretMode(false);
        setAppPassword(null);
        setShowPasswordModal(false);
        Alert.alert("성공", "시크릿 모드가 비활성화되었습니다.");
      } else {
        Alert.alert("오류", "비밀번호가 틀렸습니다.");
        setPinBuffer("");
      }
    } else if (passwordMode === "change") {
      if (passwordStep === 1) {
        if (pin === appPassword) {
          setPasswordStep(2); // 이제 새로운 비번 입력 단계
          setPinBuffer("");
        } else {
          Alert.alert("오류", "현재 비밀번호가 틀렸습니다.");
          setPinBuffer("");
        }
      } else if (passwordStep === 2) {
        setFirstPin(pin);
        setPasswordStep(3); // 새로운 비번 확인 단계
        setPinBuffer("");
      } else {
        if (pin === firstPin) {
          setAppPassword(pin);
          setShowPasswordModal(false);
          Alert.alert("성공", "비밀번호가 변경되었습니다.");
        } else {
          Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
          resetPINFlow();
          setPasswordMode("change");
          setPasswordStep(2); // 다시 새로운 비번 입력부터
        }
      }
    }
  };

  const resetPINFlow = () => {
    setPinBuffer("");
    setFirstPin("");
    setPasswordStep(1);
  };

  const handleLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        onPress: () => {
          resetStore(); // 스토어 상태 초기화
          navigation.replace("Login");
        },
        style: "destructive",
      },
    ]);
  };

  const SettingItem = ({ icon, label, rightElement, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between p-6 border-b border-white/5"
    >
      <View className="flex-row items-center">
        <View
          style={{ backgroundColor: THEMES[appTheme].accent + "1A" }}
          className="w-10 h-10 rounded-xl items-center justify-center mr-4"
        >
          {React.cloneElement(icon as React.ReactElement, { color: THEMES[appTheme].accent })}
        </View>
        <Text style={{ color: THEMES[appTheme].text }} className="font-medium">
          {label}
        </Text>
      </View>
      {rightElement ? rightElement : <ChevronRight size={20} color={THEMES[appTheme].text} opacity={0.3} />}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text
      style={{ color: THEMES[appTheme].text }}
      className="text-xs font-bold tracking-widest mt-10 mb-4 px-2 uppercase opacity-40"
    >
      {title}
    </Text>
  );

  return (
    <SafeAreaView style={{ backgroundColor: THEMES[appTheme].bg }} className="flex-1">
      {/* Header */}
      <View className="px-8 py-8 flex-row justify-between items-center border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center">
          <ArrowLeft size={28} color={THEMES[appTheme].text} />
        </TouchableOpacity>
        <Text style={{ color: THEMES[appTheme].text }} className="text-lg font-bold">
          환경 설정
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-8 pb-20" showsVerticalScrollIndicator={false}>
        {/* Notifications Section */}
        <SectionHeader title="알림" />
        <View
          style={{ backgroundColor: THEMES[appTheme].surface + "66" }}
          className="rounded-[35px] border border-white/5 overflow-hidden"
        >
          <SettingItem
            icon={<Bell size={20} />}
            label="푸시 알림"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: THEMES[appTheme].surface, true: THEMES[appTheme].accent }}
                thumbColor="#E0E0E0"
              />
            }
          />
        </View>

        {/* Display Section */}
        <SectionHeader title="화면 설정" />
        <View
          style={{ backgroundColor: THEMES[appTheme].surface + "66" }}
          className="rounded-[35px] border border-white/5 overflow-hidden"
        >
          <SettingItem
            icon={<Palette size={20} />}
            label="테마 설정"
            onPress={() => {
              setTempTheme(appTheme);
              setShowThemeModal(true);
            }}
            rightElement={
              <View className="flex-row items-center">
                <Text style={{ color: THEMES[appTheme].text }} className="text-xs mr-3 opacity-40">
                  {appTheme === "midnight"
                    ? "미드나잇"
                    : appTheme === "ocean"
                      ? "오션"
                      : appTheme === "sunset"
                        ? "선셋"
                        : "포레스트"}
                </Text>
                <ChevronRight size={20} color={THEMES[appTheme].text} opacity={0.3} />
              </View>
            }
          />
        </View>

        {/* Privacy Section */}
        <SectionHeader title="개인정보 및 보안" />
        <View
          style={{ backgroundColor: THEMES[appTheme].surface + "66" }}
          className="rounded-[35px] border border-white/5 overflow-hidden"
        >
          <SettingItem
            icon={<EyeOff size={20} />}
            label="차단된 사용자 관리"
            onPress={() => setShowBlockedModal(true)}
          />
          <SettingItem
            icon={<Lock size={20} />}
            label="시크릿 모드 (잠금)"
            rightElement={
              <Switch
                value={isSecretModeActive}
                onValueChange={(value) => {
                  resetPINFlow();
                  if (value) {
                    setPasswordMode("activate");
                    setShowPasswordModal(true);
                  } else {
                    setPasswordMode("deactivate");
                    setShowPasswordModal(true);
                  }
                }}
                trackColor={{ false: THEMES[appTheme].surface, true: THEMES[appTheme].accent }}
                thumbColor="#E0E0E0"
              />
            }
          />
          {isSecretModeActive && (
            <SettingItem
              icon={<ShieldCheck size={20} />}
              label="비밀번호 변경"
              onPress={() => {
                resetPINFlow();
                setPasswordMode("change");
                setShowPasswordModal(true);
              }}
            />
          )}
          <SettingItem
            icon={<Trash2 size={20} color="#E7433C" />}
            label="활동 기록 삭제"
            onPress={() => setShowDeleteModal(true)}
          />
        </View>

        {/* Support & Others */}
        <SectionHeader title="지원 및 정보" />
        <View
          style={{ backgroundColor: THEMES[appTheme].surface + "66" }}
          className="rounded-[35px] border border-white/5 overflow-hidden"
        >
          <SettingItem
            icon={<Info size={20} color={THEMES[appTheme].text} />}
            label="앱 버전"
            rightElement={
              <Text style={{ color: THEMES[appTheme].text }} className="text-xs opacity-30">
                v1.0.0
              </Text>
            }
          />
          <SettingItem
            icon={<Database size={20} />}
            label="오픈소스 라이선스"
            onPress={() => setShowLicenseModal(true)}
          />
          <SettingItem
            icon={<BookOpen size={20} />}
            label="이용 안내 (약관 및 정책)"
            onPress={() => setShowUsageGuideModal(true)}
          />
        </View>

        {/* Account Management */}
        <View className="mt-12 mb-20 px-2 space-y-4">
          <TouchableOpacity
            onPress={handleLogout}
            className="w-full py-6 rounded-[30px] border border-[#E7433C]/30 items-center justify-center mb-4"
          >
            <View className="flex-row items-center">
              <LogOut size={20} color="#E7433C" />
              <Text className="text-[#E7433C] font-bold ml-2">로그아웃</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              /* 
              // [유료화 전환 시 활성화 예정]
              Alert.alert(
                "너울 탈퇴하기", 
                "아직 사용하지 않은 유료 상품이 있습니다. 탈퇴 시 환불이 불가한데 정말 탈퇴하시겠습니까?",
                [
                  { text: "취소", style: "cancel" },
                  { text: "탈퇴", onPress: () => { resetStore(); navigation.replace("Login"); }, style: "destructive" }
                ]
              );
              */
              Alert.alert(
                "너울 탈퇴하기",
                "정말 너울을 떠나시겠습니까? 작성하신 소중한 사연들은 익명으로 남게 됩니다.",
                [
                  { text: "취소", style: "cancel" },
                  {
                    text: "탈퇴하기",
                    onPress: async () => {
                      try {
                        if (userId) {
                          await api.users.withdraw(userId);
                        }
                      } catch (error) {
                        console.error("Failed to withdraw:", error);
                      }
                      resetStore();
                      navigation.replace("Login");
                    },
                    style: "destructive",
                  },
                ],
              );
            }}
            className="w-full py-2 items-center justify-center"
          >
            <Text className="text-[#E0E0E0]/20 text-xs font-bold underline">너울 탈퇴하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* Theme Selection Modal */}
      <Modal visible={showThemeModal} animationType="slide" transparent={true}>
        <View style={{ backgroundColor: THEMES[appTheme].bg + "F2" }} className="flex-1 pt-20">
          <View
            style={{ backgroundColor: THEMES[appTheme].surface }}
            className="flex-1 rounded-t-[40px] border-t border-white/10"
          >
            <View className="px-8 py-8 flex-row justify-between items-center">
              <Text style={{ color: THEMES[appTheme].text }} className="text-2xl font-bold">
                테마 설정
              </Text>
              <TouchableOpacity
                onPress={() => setShowThemeModal(false)}
                className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
              >
                <X size={24} color={THEMES[appTheme].text} />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-8">
              {/* Theme Preview Card */}
              <View className="mb-10">
                <Text
                  style={{ color: THEMES[appTheme].accent }}
                  className="text-[10px] font-bold tracking-[3px] mb-4 uppercase text-center"
                >
                  PREVIEW
                </Text>
                <View
                  style={{ backgroundColor: THEMES[tempTheme].bg }}
                  className="w-full h-48 rounded-[40px] border border-white/10 overflow-hidden p-6 items-center justify-center shadow-2xl"
                >
                  <View
                    style={{ backgroundColor: THEMES[tempTheme].surface }}
                    className="w-full h-24 rounded-3xl border border-white/5 items-center justify-center mb-4"
                  >
                    <Text style={{ color: THEMES[tempTheme].accent }} className="text-xl font-bold">
                      Swell Wave
                    </Text>
                  </View>
                  <Text style={{ color: THEMES[tempTheme].text }} className="text-xs opacity-60 text-center">
                    선택한 테마가 앱 전체에 적용됩니다.{"\n"}잔잔한 물결을 느껴보세요.
                  </Text>
                </View>
              </View>

              {/* Theme Options */}
              <View
                style={{ backgroundColor: THEMES[appTheme].surface + "66" }}
                className="rounded-[35px] border border-white/5 p-6 mb-10"
              >
                <Text style={{ color: THEMES[appTheme].text }} className="font-bold mb-6 ml-2">
                  컬러 팔레트 선택
                </Text>
                <View className="flex-row flex-wrap justify-between px-2">
                  {[
                    { id: "midnight", color: "#001220", label: "미드나잇" },
                    { id: "ocean", color: "#002135", label: "오션" },
                    { id: "sunset", color: "#1A1025", label: "선셋" },
                    { id: "forest", color: "#0A120A", label: "포레스트" },
                  ].map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setTempTheme(t.id as any)}
                      className="items-center w-[22%]"
                    >
                      <View
                        style={{
                          backgroundColor: t.color,
                          borderColor: tempTheme === t.id ? THEMES[appTheme].accent : "rgba(255,255,255,0.1)",
                        }}
                        className={`w-14 h-14 rounded-2xl mb-2 items-center justify-center border-2`}
                      >
                        {tempTheme === t.id && (
                          <View style={{ backgroundColor: THEMES[appTheme].accent }} className="w-2 h-2 rounded-full" />
                        )}
                      </View>
                      <Text
                        style={{ color: tempTheme === t.id ? THEMES[appTheme].accent : THEMES[appTheme].text + "4D" }}
                        className={`text-[10px] font-bold`}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setAppTheme(tempTheme);
                  setShowThemeModal(false);
                  Alert.alert("테마 변경", "새로운 테마가 적용되었습니다.");
                }}
                style={{ backgroundColor: THEMES[appTheme].accent, shadowColor: THEMES[appTheme].accent }}
                className="py-6 rounded-[30px] items-center justify-center shadow-lg mb-12 shadow-[#00E0D0]/20"
              >
                <Text style={{ color: THEMES[appTheme].bg }} className="font-black text-lg">
                  테마 저장하기
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Blocked Users Manager Modal */}
      <Modal visible={showBlockedModal} animationType="slide" transparent={true}>
        <View style={{ backgroundColor: THEMES[appTheme].bg + "F2" }} className="flex-1 pt-24">
          <View
            style={{ backgroundColor: THEMES[appTheme].surface }}
            className="flex-1 rounded-t-[40px] border-t border-white/10"
          >
            <View className="px-8 py-8 flex-row justify-between items-center mb-4">
              <Text style={{ color: THEMES[appTheme].text }} className="text-2xl font-bold">
                차단된 사용자 관리
              </Text>
              <TouchableOpacity
                onPress={() => setShowBlockedModal(false)}
                className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
              >
                <X size={24} color={THEMES[appTheme].text} />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-8">
              {blockedUsers.length === 0 ? (
                <View className="flex-1 items-center justify-center pt-24">
                  <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center mb-6">
                    <UserX size={32} color={THEMES[appTheme].text} opacity={0.2} />
                  </View>
                  <Text style={{ color: THEMES[appTheme].text }} className="text-lg font-bold opacity-30">
                    차단된 사용자가 없습니다
                  </Text>
                </View>
              ) : (
                blockedUsers.map((user) => (
                  <View
                    key={user.id}
                    style={{ backgroundColor: THEMES[appTheme].surface + "66" }}
                    className="p-6 rounded-[35px] border border-white/5 mb-4 flex-row justify-between items-center"
                  >
                    <View className="flex-1">
                      <Text style={{ color: THEMES[appTheme].text }} className="font-bold text-lg mb-1">
                        {user.nickname}
                      </Text>
                      <Text style={{ color: THEMES[appTheme].text }} className="text-xs font-medium opacity-30">
                        차단 일시: {user.blockedAt}
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        Alert.alert("차단 해제", `${user.nickname}님의 차단을 해제하시겠습니까?`, [
                          { text: "취소", style: "cancel" },
                          {
                            text: "해제",
                            onPress: () => unblockUser(user.id),
                            style: "destructive",
                          },
                        ]);
                      }}
                      className="bg-[#E7433C]/10 h-12 px-6 rounded-2xl border border-[#E7433C]/20 items-center justify-center"
                    >
                      <Text className="text-[#E7433C] text-sm font-bold">해제</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
              <View className="h-20" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Open Source License Modal */}
      <Modal visible={showLicenseModal} animationType="slide" transparent={true}>
        <View style={{ backgroundColor: THEMES[appTheme].bg + "F2" }} className="flex-1 pt-24">
          <View
            style={{ backgroundColor: THEMES[appTheme].surface }}
            className="flex-1 rounded-t-[40px] border-t border-white/10"
          >
            <View className="px-8 py-8 flex-row justify-between items-center mb-6">
              <Text style={{ color: THEMES[appTheme].text }} className="text-2xl font-bold">
                오픈소스 라이선스
              </Text>
              <TouchableOpacity
                onPress={() => setShowLicenseModal(false)}
                className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
              >
                <X size={24} color={THEMES[appTheme].text} />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false}>
              <View
                style={{ backgroundColor: THEMES[appTheme].surface + "33" }}
                className="p-8 rounded-[35px] border border-white/5 mb-8"
              >
                <Text style={{ color: THEMES[appTheme].text }} className="text-sm leading-7 mb-8 px-2 opacity-60">
                  너울(Swell)은 더 나은 서비스를 만들기 위해 다양한 오픈소스를 사용하고 있습니다. 사용된 라이브러리에
                  기여한 모든 개발자분들께 감사드립니다.
                </Text>

                {[
                  { name: "React & React Native", license: "MIT", url: "facebook/react-native" },
                  { name: "Expo SDK", license: "MIT", url: "expo/expo" },
                  { name: "Zustand", license: "MIT", url: "pmndrs/zustand" },
                  { name: "NativeWind", license: "MIT", url: "marklawlor/nativewind" },
                  { name: "Lucide React Native", license: "ISC", url: "lucide-icons/lucide" },
                  { name: "React Navigation", license: "MIT", url: "react-navigation/react-navigation" },
                  { name: "React Native Reanimated", license: "MIT", url: "software-mansion/react-native-reanimated" },
                  {
                    name: "React Native Async Storage",
                    license: "MIT",
                    url: "react-native-async-storage/async-storage",
                  },
                ].map((lib, i) => (
                  <View
                    key={i}
                    className="flex-row items-center justify-between py-6 border-b border-white/5 last:border-b-0"
                  >
                    <View className="flex-1 pr-4">
                      <Text style={{ color: THEMES[appTheme].text }} className="font-bold text-base mb-1">
                        {lib.name}
                      </Text>
                      <Text style={{ color: THEMES[appTheme].text }} className="text-xs font-medium opacity-30">
                        {lib.url}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: THEMES[appTheme].accent + "1A",
                        borderColor: THEMES[appTheme].accent + "33",
                      }}
                      className="px-3 py-1.5 rounded-xl border"
                    >
                      <Text
                        style={{ color: THEMES[appTheme].accent }}
                        className="text-[10px] font-black uppercase tracking-widest"
                      >
                        {lib.license}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              <View className="h-20" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PIN Input Modal */}
      <Modal visible={showPasswordModal} animationType="fade" transparent={true}>
        <View className="flex-1 bg-black/90 items-center justify-center px-8">
          <View
            style={{ backgroundColor: THEMES[appTheme].surface }}
            className="w-full p-10 rounded-[40px] border border-white/10 items-center"
          >
            <View
              style={{ backgroundColor: THEMES[appTheme].accent + "1A" }}
              className="w-16 h-16 rounded-full items-center justify-center mb-6"
            >
              <Lock size={32} color={THEMES[appTheme].accent} />
            </View>

            <Text style={{ color: THEMES[appTheme].text }} className="text-xl font-bold mb-2">
              {passwordMode === "activate"
                ? passwordStep === 1
                  ? "비밀번호 설정"
                  : "비밀번호 확인"
                : passwordMode === "deactivate"
                  ? "비밀번호 입력"
                  : passwordStep === 1
                    ? "현재 비밀번호 입력"
                    : passwordStep === 2
                      ? "새 비밀번호 입력"
                      : "새 비밀번호 확인"}
            </Text>
            <Text style={{ color: THEMES[appTheme].text }} className="opacity-40 text-sm mb-10">
              {passwordMode === "activate" && passwordStep === 2
                ? "한 번 더 입력해 주세요"
                : "4자리 숫자를 입력해 주세요"}
            </Text>

            {/* PIN Dots */}
            <View className="flex-row space-x-6 mb-12">
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: pinBuffer.length >= i ? THEMES[appTheme].accent : THEMES[appTheme].text + "1A",
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                  }}
                />
              ))}
            </View>

            {/* Numeric Pad */}
            <View className="w-full flex-row flex-wrap justify-between">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "delete"].map((val, idx) => (
                <TouchableOpacity
                  key={idx}
                  disabled={val === ""}
                  onPress={() => {
                    if (val === "delete") setPinBuffer(pinBuffer.slice(0, -1));
                    else if (val !== "") handlePINPress(val);
                  }}
                  className="w-[30%] h-20 items-center justify-center mb-2"
                >
                  {val === "delete" ? (
                    <ArrowLeft size={24} color={THEMES[appTheme].text} />
                  ) : (
                    <Text style={{ color: THEMES[appTheme].text }} className="text-2xl font-bold">
                      {val}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                setShowPasswordModal(false);
                resetPINFlow();
              }}
              className="mt-8"
            >
              <Text style={{ color: "#E7433C" }} className="font-bold">
                취소
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Activity History Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent={true}>
        <View className="flex-1 bg-black/80 items-center justify-center p-8">
          <View
            style={{ backgroundColor: THEMES[appTheme].surface }}
            className="p-10 rounded-[40px] border border-[#E7433C]/20 w-full items-center"
          >
            <View className="w-16 h-16 bg-[#E7433C]/10 rounded-full items-center justify-center mb-6">
              <ShieldAlert size={32} color="#E7433C" />
            </View>
            <Text style={{ color: THEMES[appTheme].text }} className="text-xl font-bold mb-4 text-center">
              활동 기록 삭제
            </Text>
            <Text style={{ color: THEMES[appTheme].text }} className="text-center leading-7 mb-10 text-sm opacity-60">
              모든 게시글 및 댓글이 삭제되며{"\n"}
              사용자 등급 및 뱃지 데이터가{"\n"}
              초기화되어 복구할 수 없습니다.{"\n\n"}
              정말로 모든 기록을 삭제하시겠습니까?
            </Text>

            <View className="flex-row space-x-4 w-full">
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                className="flex-1 bg-white/5 py-4 rounded-2xl items-center"
              >
                <Text style={{ color: THEMES[appTheme].text }} className="font-bold">
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    if (userId) {
                      await api.users.deleteHistory(userId);
                      Alert.alert("완료", "모든 활동 기록이 삭제되었습니다.");
                    }
                  } catch (error) {
                    Alert.alert("오류", "활동 기록 삭제 중 문제가 발생했습니다.");
                  } finally {
                    setShowDeleteModal(false);
                  }
                }}
                className="flex-1 bg-[#E7433C] py-4 rounded-2xl items-center"
              >
                <Text className="text-white font-bold">삭제하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Usage Guide Modal (Comprehensive) */}
      <Modal visible={showUsageGuideModal} animationType="slide" transparent={true}>
        <View style={{ backgroundColor: THEMES[appTheme].bg + "F2" }} className="flex-1 pt-24">
          <View
            style={{ backgroundColor: THEMES[appTheme].surface }}
            className="flex-1 rounded-t-[40px] border-t border-white/10"
          >
            <View className="px-8 py-8 flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <BookOpen size={28} color={THEMES[appTheme].accent} />
                <Text style={{ color: THEMES[appTheme].text }} className="text-2xl font-bold ml-3">
                  이용 안내
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowUsageGuideModal(false)}
                className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
              >
                <X size={24} color={THEMES[appTheme].text} />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-8 mb-10" showsVerticalScrollIndicator={false}>
              <View
                style={{ backgroundColor: THEMES[appTheme].surface + "66" }}
                className="rounded-[35px] border border-white/5 p-8 space-y-12"
              >
                {/* 1. 서비스 이용약관 */}
                <View>
                  <View className="flex-row items-center mb-6">
                    <View
                      style={{ backgroundColor: THEMES[appTheme].accent }}
                      className="w-1.5 h-6 rounded-full mr-3"
                    />
                    <Text style={{ color: THEMES[appTheme].text }} className="text-xl font-black">
                      1. 서비스 이용약관
                    </Text>
                  </View>
                  <View className="space-y-8">
                    {/* 제1장 총칙 */}
                    <View>
                      <Text style={{ color: THEMES[appTheme].accent }} className="text-base font-bold mb-4">
                        제1장 총칙
                      </Text>
                      <View className="space-y-4">
                        <View>
                          <Text style={{ color: THEMES[appTheme].text }} className="text-sm font-bold mb-1 opacity-80">
                            제1조 (목적)
                          </Text>
                          <Text style={{ color: THEMES[appTheme].text }} className="leading-6 opacity-60 text-sm">
                            본 약관은 너울 팀(이하 “회사”)이 제공하는 ‘너울(Swell)’ 서비스(이하 “서비스”)의 이용과
                            관련하여 회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.
                          </Text>
                        </View>
                        <View>
                          <Text style={{ color: THEMES[appTheme].text }} className="text-sm font-bold mb-1 opacity-80">
                            제2조 (정의)
                          </Text>
                          <Text style={{ color: THEMES[appTheme].text }} className="leading-6 opacity-60 text-sm">
                            1. “서비스”라 함은 회원이 이용할 수 있는 ‘너울(Swell)’ 앱 및 이와 관련된 제반 서비스를
                            의미합니다.{"\n"}
                            2. “회원”이라 함은 본 약관에 동의하고 이용계약을 체결하여 서비스를 이용하는 고객을 말합니다.
                            {"\n"}
                            3. “직종 인증”이라 함은 회사가 정한 절차에 따라 회원의 직업적 신원을 확인하고 인증 배지 등을
                            부여하는 행위를 말합니다.{"\n"}
                            4. “콘텐츠”라 함은 회사 또는 회원이 서비스상에 게시한 글, 사진, 동영상, 유료 아이템 등을
                            의미합니다.{"\n"}
                            5. “인앱결제”라 함은 Apple App Store, Google Play Store 내에서 유료 콘텐츠나 구독 상품을
                            구매하기 위해 사용하는 결제 수단을 의미합니다.
                          </Text>
                        </View>
                        <View>
                          <Text style={{ color: THEMES[appTheme].text }} className="text-sm font-bold mb-1 opacity-80">
                            제3조 (신원정보 등의 제공)
                          </Text>
                          <Text style={{ color: THEMES[appTheme].text }} className="leading-6 opacity-60 text-sm">
                            회사는 상호, 대표자 성명, 주소, 전자우편주소 및 개인정보관리책임자 등을 이용자가 쉽게 알 수
                            있도록 서비스 내 설정 화면 등에 게시합니다.
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 제2장 회원가입 및 관리 */}
                    <View>
                      <Text style={{ color: THEMES[appTheme].accent }} className="text-base font-bold mb-4">
                        제2장 회원가입 및 관리
                      </Text>
                      <View className="space-y-4">
                        <View>
                          <Text style={{ color: THEMES[appTheme].text }} className="text-sm font-bold mb-1 opacity-80">
                            제7조 (회원가입 및 직종 인증)
                          </Text>
                          <Text style={{ color: THEMES[appTheme].text }} className="leading-6 opacity-60 text-sm">
                            1. 회원가입은 이용자가 본 약관 및 개인정보 처리방침에 동의한 후 신청하고, 회사가
                            승낙함으로써 체결됩니다.{"\n"}
                            2. [너울 특화 조항] 본 서비스는 성인 및 직장인을 대상으로 합니다. 회사는 서비스의 신뢰성을
                            위해 직장 이메일, 명함 이미지 등을 통한 직종 인증을 요구할 수 있습니다.{"\n"}
                            3. 타인의 명의나 정보를 도용하여 가입하거나 인증을 시도한 경우, 회사는 즉시 계정을 정지하고
                            관련 법적 책임을 물을 수 있습니다.
                          </Text>
                        </View>
                        <View>
                          <Text style={{ color: THEMES[appTheme].text }} className="text-sm font-bold mb-1 opacity-80">
                            제8조 (회원탈퇴 및 자격 상실)
                          </Text>
                          <Text style={{ color: THEMES[appTheme].text }} className="leading-6 opacity-60 text-sm">
                            1. 회원은 언제든지 앱 내 '탈퇴하기' 기능을 통해 계약 해지를 요청할 수 있으며, 회사는 즉시
                            처리합니다.{"\n"}
                            2. 회원이 다음 각 호에 해당하는 경우 회사는 자격을 제한하거나 정지시킬 수 있습니다.{"\n"}-
                            타인에 대한 비방, 욕설, 혐오 표현을 게시한 경우{"\n"}- 직장 내 괴롭힘을 유도하거나 특정
                            기업의 영업 비밀을 유포하는 경우{"\n"}- 서비스 운영을 고의로 방해하는 경우
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 제3장 콘텐츠 이용 및 결제 */}
                    <View>
                      <Text style={{ color: THEMES[appTheme].accent }} className="text-base font-bold mb-4">
                        제3장 콘텐츠 이용 및 결제
                      </Text>
                      <View className="space-y-4">
                        <View>
                          <Text style={{ color: THEMES[appTheme].text }} className="text-sm font-bold mb-1 opacity-80">
                            제15조 (유료 서비스 및 환불)
                          </Text>
                          <Text style={{ color: THEMES[appTheme].text }} className="leading-6 opacity-60 text-sm">
                            1. <Text className="font-bold underline">(결제 방식)</Text> 앱 내 유료 서비스(정기 구독,
                            단건 아이템 등)는 Apple App Store 및 Google Play Store에서 제공하는 인앱 결제 시스템을
                            통해서만 결제 가능하며, 결제 금액에는 해당 스토어의 수수료와 부가세가 포함될 수 있습니다.
                            {"\n"}
                            2. <Text className="font-bold underline">(청약철회 및 환불 원칙)</Text>
                            {"\n"}• 미사용 상품: 구매 후 7일 이내에 사용 이력이 없는 상품은 환불이 가능합니다.{"\n"}•
                            사용 상품: 구매 즉시 효력이 발생하거나, 일부라도 사용(사연 조회, 아이템 적용 등)한 상품은
                            원칙적으로 환불이 불가능합니다.{"\n"}• 구독 상품: 정기 구독은 언제든지 해지할 수 있으나,
                            이미 결제된 해당 월의 잔여 기간에 대한 부분 환불은 스토어 정책에 따라 제한될 수 있습니다.
                            {"\n"}
                            3. <Text className="font-bold underline">(환불 절차의 귀속)</Text> 결제 취소 및 환불 권한은
                            각 앱 마켓 사업자(Apple/Google)에게 있습니다. 이용자가 직접 환불을 원하는 경우, 각 스토어의
                            고객센터를 통해 신청해야 합니다.{"\n"}
                            4. <Text className="font-bold underline">(환불 제한 사항)</Text> 서비스 약관 및 가이드라인
                            위반(유튜브 콘텐츠화 동의 위반 등)으로 계정이 '영구 정지'된 사용자의 경우, 잔여 구독 기간에
                            대한 환불은 청구할 수 없습니다. 무상 지급된 포인트 등은 현금 환불 대상이 아닙니다.{"\n"}
                          </Text>
                        </View>

                        {/* 구매 전 확인 사항 */}
                        <View
                          style={{ backgroundColor: THEMES[appTheme].accent + "0D" }}
                          className="p-6 rounded-3xl border border-white/5"
                        >
                          <Text
                            style={{ color: THEMES[appTheme].accent }}
                            className="text-sm font-black mb-3 text-center"
                          >
                            🛒 구매 전 확인해 주세요!
                          </Text>
                          <Text style={{ color: THEMES[appTheme].text }} className="text-xs leading-6 opacity-60">
                            • '너울'의 유료 콘텐츠는 구매 및 사용 즉시 효력이 발생하므로, 사용 후에는 환불이 어렵습니다.
                            {"\n"}• 모든 결제 및 환불 처리는 Apple/Google의 스토어 정책을 따릅니다.{"\n"}• 구독 해지는
                            각 스토어 계정 설정에서 직접 관리하실 수 있습니다.{"\n"}• 서비스 위반으로 계정이 정지된 경우
                            환불이 제한될 수 있으니 이용 규칙을 준수해 주세요.
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* 제4장 서비스 이용 규칙 및 책임 */}
                    <View>
                      <Text style={{ color: THEMES[appTheme].accent }} className="text-base font-bold mb-4">
                        제4장 서비스 이용 규칙 및 책임
                      </Text>
                      <View className="space-y-4">
                        <View>
                          <Text style={{ color: THEMES[appTheme].text }} className="text-sm font-bold mb-1 opacity-80">
                            제18조 (이용자의 의무)
                          </Text>
                          <Text style={{ color: THEMES[appTheme].text }} className="leading-6 opacity-60 text-sm">
                            이용자는 다음 행위를 하여서는 안 됩니다.{"\n"}
                            1. 타인의 회사명이나 직급을 사칭하는 행위{"\n"}
                            2. 커뮤니티 내에서 특정인을 특정하여 괴롭히거나 신상을 공개(아웃팅)하는 행위{"\n"}
                            3. 상업적인 광고나 홍보물을 무단으로 게시하는 행위{"\n"}
                            4. 서비스의 익명성을 악용하여 허위 사실을 유포하는 행위
                          </Text>
                        </View>
                        <View>
                          <Text style={{ color: THEMES[appTheme].text }} className="text-sm font-bold mb-1 opacity-80">
                            제24조 (게시물의 저작권 및 영리적 활용)
                          </Text>
                          <Text style={{ color: THEMES[appTheme].text }} className="leading-6 opacity-60 text-sm">
                            1. 회원이 서비스 내에 게시한 글의 저작권은 해당 회원에게 귀속됩니다.{"\n"}
                            2. <Text className="font-bold underline">(영리적 이용 권한 부여)</Text> 회원은 본 서비스를
                            이용함으로써, 회사가 회원의 게시물을 아래와 같은 영리적 목적으로 이용하는 것에 대하여 전
                            세계적, 영구적, 무상의 독점적 이용권을 회사에 부여합니다.{"\n"}- 유튜브, SNS 등 외부 매체를
                            위한 콘텐츠 제작 및 송출{"\n"}- 콘텐츠를 통한 광고 수익, 후원 수익, 협찬 수익 등 일체의
                            상업적 이익 취득{"\n"}- 게시물의 각색, 편집, 수정을 통한 2차 저작물 작성 및 배포{"\n"}
                            3. <Text className="font-bold underline">(수익 귀속)</Text> 제2항에 따른 게시물의 활용으로
                            인해 발생하는 모든 경제적 이익은 전적으로 ‘회사’에 귀속됩니다. 회원은 회사에 별도의 수익
                            배분, 저작권료 등을 청구할 수 없습니다.{"\n"}
                            4. <Text className="font-bold underline">(포괄적 동의)</Text> 회원은 서비스 가입과 동시에 본
                            조항의 내용을 충분히 숙지하였으며, 자신의 게시물이 영리 목적의 콘텐츠 소재로 사용됨에 대해
                            포괄적으로 동의한 것으로 간주합니다.{"\n"}
                            5. <Text className="font-bold underline">(익명성 및 면책)</Text> 회사는 콘텐츠 제작 시
                            회원의 신분이 노출되지 않도록 가명 처리 등 보호 조치를 취합니다. 다만, 회원이 글 내에
                            포함시킨 개인정보로 인한 사고는 회사가 책임지지 않습니다.{"\n"}
                            6. <Text className="font-bold underline">(리워드 정책)</Text> 회사는 수익 배분의 의무는
                            없으나, 채택된 사연자에게 별도의 포인트나 경품을 지급할 수 있습니다.
                          </Text>
                        </View>
                        <View>
                          <Text style={{ color: THEMES[appTheme].text }} className="text-sm font-bold mb-1 opacity-80">
                            제32조 (면책조항)
                          </Text>
                          <Text style={{ color: THEMES[appTheme].text }} className="leading-6 opacity-60 text-sm">
                            1. 회사는 회원 간의 대화나 게시물 내용의 진실성, 정확성에 대하여 보증하지 않으며, 회원 상호
                            간에 발생한 분쟁에 대해 책임을 지지 않습니다.{"\n"}
                            2. 천재지변, 서버 점검, 통신 장애 등 불가항력적인 사유로 서비스가 중단된 경우 회사는 책임을
                            면합니다.
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 2. 개인정보 처리방침 */}
                <View>
                  <View className="flex-row items-center mb-6">
                    <View
                      style={{ backgroundColor: THEMES[appTheme].accent }}
                      className="w-1.5 h-6 rounded-full mr-3"
                    />
                    <Text style={{ color: THEMES[appTheme].text }} className="text-xl font-black">
                      2. 개인정보 처리방침
                    </Text>
                  </View>
                  <View className="space-y-8">
                    <View>
                      <Text style={{ color: THEMES[appTheme].text }} className="leading-7 opacity-70 text-sm mb-4">
                        'Noul(너울)'(이하 '회사')은(는) 개인정보보호법 제30조에 의거하여 이용자의 개인정보 및 권익을
                        보호하고 이와 관련한 고충 및 불만을 신속하게 처리하기 위하여 아래와 같이 개인정보 처리방침을
                        수립하여 운영하고 있습니다.{"\n"}
                        <Text className="font-bold underline">시행일 : 2026-02-20</Text>
                      </Text>
                    </View>

                    {/* 제1조 */}
                    <View>
                      <Text style={{ color: THEMES[appTheme].accent }} className="text-sm font-bold mb-3">
                        제1조 개인정보의 수집 및 이용에 관한 안내
                      </Text>
                      <Text style={{ color: THEMES[appTheme].text }} className="leading-7 opacity-60 text-sm mb-4">
                        회사는 서비스 이용에 필요한 최소한의 개인정보를 수집하고 있습니다. 회사는 이용자의 개인정보를
                        아래와 같이 처리합니다.
                      </Text>

                      <Text style={{ color: THEMES[appTheme].text }} className="text-xs font-bold mb-2 opacity-40">
                        [회원가입 및 서비스 이용]
                      </Text>
                      <View className="border border-white/5 rounded-2xl overflow-hidden mb-6">
                        {[
                          {
                            purpose: "회원 식별 및 가입",
                            essential: "닉네임, 계정 이메일, 성별, 연령대",
                            optional: "프로필 사진",
                            period: "회원탈퇴 후 즉시 파기",
                          },
                          {
                            purpose: "직종 인증 (신뢰도)",
                            essential: "직장 이메일 또는 명함 이미지",
                            optional: "직무/업종 정보",
                            period: "인증 완료 즉시 파기",
                          },
                          {
                            purpose: "유료 콘텐츠 결제",
                            essential: "결제 식별 번호(Receipt ID), 구매 내역",
                            optional: "-",
                            period: "법정 의무 기간(5년)",
                          },
                          {
                            purpose: "CS 대응",
                            essential: "닉네임, 계정 이메일, 문의 내용",
                            optional: "-",
                            period: "문의 해결 후 1개월",
                          },
                          {
                            purpose: "소셜 로그인",
                            essential: "이름, 이메일, 내부 식별값",
                            optional: "프로필 사진",
                            period: "회원탈퇴 후 즉시 파기",
                          },
                          {
                            purpose: "영리 목적 콘텐츠 활용",
                            essential: "서비스 내 게시글 및 답변 내용",
                            optional: "-",
                            period: "회원탈퇴 시까지 (콘텐츠화된 경우 영구)",
                          },
                        ].map((item, idx) => (
                          <View
                            key={idx}
                            style={{ backgroundColor: idx % 2 === 0 ? THEMES[appTheme].surface + "33" : "transparent" }}
                            className="p-4 border-b border-white/5 last:border-b-0 space-y-1"
                          >
                            <Text style={{ color: THEMES[appTheme].accent }} className="text-xs font-bold">
                              {item.purpose}
                            </Text>
                            <Text style={{ color: THEMES[appTheme].text }} className="text-xs opacity-60">
                              필수: {item.essential}
                            </Text>
                            <Text style={{ color: THEMES[appTheme].text }} className="text-xs opacity-60">
                              선택: {item.optional}
                            </Text>
                            <Text style={{ color: THEMES[appTheme].text }} className="text-[10px] italic opacity-30">
                              보유기간: {item.period}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <Text style={{ color: THEMES[appTheme].text }} className="text-xs font-bold mb-2 opacity-40">
                        [마케팅 활용 (동의 시)]
                      </Text>
                      <View
                        style={{ backgroundColor: THEMES[appTheme].accent + "0D" }}
                        className="p-4 rounded-2xl border border-white/5 space-y-1"
                      >
                        <Text style={{ color: THEMES[appTheme].accent }} className="text-xs font-bold">
                          이벤트 안내, 맞춤형 콘텐츠 추천, 신규 기능 홍보
                        </Text>
                        <Text style={{ color: THEMES[appTheme].text }} className="text-xs opacity-60">
                          필수 항목: 닉네임, 이메일 주소
                        </Text>
                        <Text style={{ color: THEMES[appTheme].text }} className="text-[10px] italic opacity-30">
                          보유기간: 동의 철회 시 또는 탈퇴 시
                        </Text>
                      </View>
                    </View>

                    {/* 제2조 ~ 제11조 */}
                    {[
                      {
                        title: "제2조 민감정보의 처리에 관한 사항",
                        content:
                          "회사는 이용자의 사상, 신념, 과거 병력 등 사생활을 침해할 우려가 있는 민감정보를 수집하지 않습니다.",
                      },
                      {
                        title: "제3조 만 19세 미만 이용자의 개인정보 처리에 관한 사항",
                        content:
                          "Noul(너울)은 성인 및 직장인을 대상으로 하는 서비스로, 만 19세 미만 아동 및 청소년의 개인정보를 수집하지 않으며 가입을 제한합니다.",
                      },
                      {
                        title: "제4조 개인정보 자동수집 장치의 설치·운영과 행태정보 처리",
                        content:
                          "회사는 이용자에게 최적화된 서비스 제공 및 온라인 광고 성과 분석을 위하여 행태정보를 수집·이용합니다.\n• 사용 분석 도구: Google Analytics, Firebase Analytics\n• 거부 방법: 스마트폰 설정에서 광고 추적 제한 (iOS: 설정 > 개인정보 보호 > 추적 / Android: 설정 > 개인정보 보호 > 광고)",
                      },
                      {
                        title: "제5조 개인정보의 보유·이용기간 및 파기",
                        content:
                          "회사는 이용자가 회원 탈퇴를 요청하거나 수집 목적이 달성된 경우 지체 없이 해당 정보를 파기합니다.\n- 부정이용 방지: 탈퇴 후 1개월간 식별할 수 없는 상태로 가입 정보를 보관하여 부정 재가입을 방지합니다.\n- 관련 법령 보관: 결제 기록 5년(전자상거래법), 접속 기록 3개월(통신비밀보호법) 보관합니다.",
                      },
                      {
                        title: "제6조 개인정보 처리 위탁",
                        content:
                          "회사는 원활한 서비스 제공을 위해 아래와 같이 업무를 위탁하고 있습니다.\n• Google Firebase: 서버 운영, 데이터 보관, 푸시 메시지 발송\n• Apple / Google: 인앱 결제 서비스 제공 및 결제 대행",
                      },
                      {
                        title: "제7조 개인정보의 제3자 제공",
                        content:
                          "회사는 이용자의 개인정보를 명시한 범위 내에서만 처리하며, 이용자의 사전 동의 없이는 제3자에게 제공하지 않습니다. 다만, 법령의 특별한 규정이 있거나 수사 기관의 적법한 절차에 따른 요청이 있는 경우는 예외로 합니다.",
                      },
                      {
                        title: "제8조 개인정보의 국외 이전",
                        content:
                          "회사는 글로벌 클라우드 인프라를 활용하여 다음과 같이 데이터를 국외에 보관합니다.\n• 대상 업체: Google (Firebase) / 미국\n• 이전 목적: 서비스 데이터 저장 및 서버 운영\n• 보유 기간: 회원 탈퇴 시 또는 계약 종료 시까지",
                      },
                      {
                        title: "제9조 개인정보의 안전성 확보조치",
                        content:
                          "회사는 이용자의 개인정보를 안전하게 관리하기 위해 암호화 저장, 해킹 방지 보안 프로그램 설치, 개인정보 취급 직원의 최소화 등 기술적/관리적 조치를 다하고 있습니다.",
                      },
                      {
                        title: "제10조 이용자의 권리와 그 행사 방법",
                        content:
                          "이용자는 언제든지 앱 내 [설정 > 내 정보]에서 개인정보를 열람하거나 수정할 수 있습니다.\n• 회원 탈퇴: 앱 내 [설정 > 계정 관리 > 너울 탈퇴하기]를 통해 즉시 권리 행사가 가능합니다.",
                      },
                      {
                        title: "제11조 개인정보 보호책임자",
                        content:
                          "이용자의 개인정보 관련 문의 및 피해 구제 신청은 아래 책임자에게 연락해 주시기 바랍니다.\n성명: 최너울\n직책: 대표이사\n연락처: support@swell_noul.com",
                      },
                    ].map((article, idx) => (
                      <View key={idx}>
                        <Text style={{ color: THEMES[appTheme].accent }} className="text-sm font-bold mb-2">
                          {article.title}
                        </Text>
                        <Text style={{ color: THEMES[appTheme].text }} className="leading-7 opacity-60 text-sm">
                          {article.content}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 3. 마케팅 활용 동의 */}
                <View>
                  <View className="flex-row items-center mb-6">
                    <View
                      style={{ backgroundColor: THEMES[appTheme].accent }}
                      className="w-1.5 h-6 rounded-full mr-3"
                    />
                    <Text style={{ color: THEMES[appTheme].text }} className="text-xl font-black">
                      3. 마케팅 활용 동의 (선택)
                    </Text>
                  </View>
                  <View className="space-y-4">
                    <Text style={{ color: THEMES[appTheme].text }} className="leading-7 opacity-60 text-sm">
                      본 동의는 선택 사항이며, 동의하지 않더라도 기본적인 서비스 이용에 제한을 받지 않습니다.{"\n\n"}
                      1. <Text className="font-bold">목적:</Text> 이벤트 혜택 알림, 맞춤형 콘텐츠 추천, 서비스 이용 관련
                      통계 분석 및 광고성 정보 발송(Push/Email).{"\n"}
                      2. <Text className="font-bold">항목:</Text> 닉네임, 이메일, 앱 내 활동 기록, 기기 식별값.{"\n"}
                      3. <Text className="font-bold">보유 기간:</Text> 회원 탈퇴 시 또는 마케팅 동의 철회 시까지.
                      {"\n\n"}※ 야간(21:00 ~ 익일 08:00) 광고성 정보 수신은 별도의 야간 수신 동의가 필요합니다.
                    </Text>
                  </View>
                </View>

                {/* 4. 커뮤니티 가이드라인 */}
                <View>
                  <View className="flex-row items-center mb-6">
                    <View
                      style={{ backgroundColor: THEMES[appTheme].accent }}
                      className="w-1.5 h-6 rounded-full mr-3"
                    />
                    <Text style={{ color: THEMES[appTheme].text }} className="text-xl font-black">
                      4. 커뮤니티 가이드라인
                    </Text>
                  </View>
                  <View className="space-y-6">
                    <View>
                      <Text style={{ color: THEMES[appTheme].accent }} className="text-sm font-bold mb-2">
                        제 1조 (건강한 소통의 원칙)
                      </Text>
                      <Text style={{ color: THEMES[appTheme].text }} className="leading-7 opacity-60 text-sm">
                        너울(Swell)은 익명성을 기반으로 한 신뢰와 존중의 커뮤니티를 지향합니다. 모든 게시물은 타인에게
                        해를 끼치지 않는 선에서 작성되어야 합니다.
                      </Text>
                    </View>
                    <View>
                      <Text style={{ color: THEMES[appTheme].accent }} className="text-sm font-bold mb-2">
                        제 2조 (금지 행위 및 제재 대상)
                      </Text>
                      <Text style={{ color: THEMES[appTheme].text }} className="leading-7 opacity-60 text-sm">
                        • <Text className="font-bold">비방 및 혐오:</Text> 특정 개인, 기업, 단체에 대한 근거 없는
                        비방이나 인종, 성별, 지역 기반의 혐오 표현.{"\n"}•{" "}
                        <Text className="font-bold">아웃팅(Outing):</Text> 상대방이 원치 않는 개인정보나 신상을 공개하는
                        행위 (적발 시 즉시 영구 정지).{"\n"}• <Text className="font-bold">낚시/도배:</Text> 무의미한
                        텍스트의 반복적 게시 및 사용자를 기만하는 허위 정보 유포.{"\n"}•{" "}
                        <Text className="font-bold">불법 홍보:</Text> 도박, 유흥, 기타 불법적인 서비스의 홍보 및 거래
                        유도.
                      </Text>
                    </View>
                    <View>
                      <Text style={{ color: THEMES[appTheme].accent }} className="text-sm font-bold mb-2">
                        제 3조 (제재 절차)
                      </Text>
                      <Text style={{ color: THEMES[appTheme].text }} className="leading-7 opacity-60 text-sm">
                        가이드라인 위반 시 위반 수위에 따라 [주의 -&gt; 3일 제한 -&gt; 7일 제한 -&gt; 30일 제한 -&gt;
                        영구 정지] 순으로 제재가 진행될 수 있습니다.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 5. 청소년 보호정책 */}
                <View>
                  <View className="flex-row items-center mb-6">
                    <View
                      style={{ backgroundColor: THEMES[appTheme].accent }}
                      className="w-1.5 h-6 rounded-full mr-3"
                    />
                    <Text style={{ color: THEMES[appTheme].text }} className="text-xl font-black">
                      5. 청소년 보호정책
                    </Text>
                  </View>
                  <View className="space-y-4">
                    <Text style={{ color: THEMES[appTheme].text }} className="leading-7 opacity-60 text-sm">
                      너울(Swell)은 청소년보호법에 의거하여 청소년이 건전하고 안전한 환경에서 성장할 수 있도록 청소년
                      유해 정보 차단 및 모니터링을 실시합니다.{"\n\n"}
                      1. <Text className="font-bold">가입 제한:</Text> 실시간 연령 확인 시스템을 통해 만 19세 미만
                      청소년의 접근을 원천적으로 차단합니다.{"\n"}
                      2. <Text className="font-bold">유해 정보 필터링:</Text> 인공지능 자가 필터링 시스템을 가동하여
                      부적절한 언어 및 시각적 매체를 차단합니다.{"\n"}
                      3. <Text className="font-bold">책임자 지정:</Text> 청소년 보호를 위한 전담 관리자를 지정하여 상시
                      신고를 처리합니다.
                    </Text>
                  </View>
                </View>

                {/* 6. 결제 및 환불 운영 정책 */}
                <View>
                  <View className="flex-row items-center mb-6">
                    <View
                      style={{ backgroundColor: THEMES[appTheme].accent }}
                      className="w-1.5 h-6 rounded-full mr-3"
                    />
                    <Text style={{ color: THEMES[appTheme].text }} className="text-xl font-black">
                      6. 결제 및 환불 운영 정책
                    </Text>
                  </View>
                  <View className="space-y-6">
                    <View>
                      <Text style={{ color: THEMES[appTheme].accent }} className="text-sm font-bold mb-2">
                        제 1조 (결제 수단)
                      </Text>
                      <Text style={{ color: THEMES[appTheme].text }} className="leading-7 opacity-60 text-sm">
                        모든 유료 콘텐츠 및 서비스 이용료는 Apple App Store 및 Google Play Store의 인앱 결제 시스템을
                        통해 결제됩니다.
                      </Text>
                    </View>
                    <View>
                      <Text style={{ color: THEMES[appTheme].accent }} className="text-sm font-bold mb-2">
                        제 2조 (청약 철회 및 환불 기준)
                      </Text>
                      <Text style={{ color: THEMES[appTheme].text }} className="leading-7 opacity-60 text-sm">
                        1. <Text className="font-bold">미사용 상품:</Text> 결제 후 7일 이내에는 청약 철회(환불)가
                        가능합니다.{"\n"}
                        2. <Text className="font-bold">사용 상품:</Text> 디지털 콘텐츠의 특성상 구매 즉시 사용되거나
                        포인트/토큰 형태로 일부 소모된 경우 환불이 제한될 수 있습니다.{"\n"}
                        3. <Text className="font-bold">정액제(구독):</Text> 구독 기간 중 해지 시 남은 기간은 이용이
                        가능하며 다음 결제 주기부터 결제되지 않습니다.
                      </Text>
                    </View>
                    <View>
                      <Text style={{ color: THEMES[appTheme].accent }} className="text-sm font-bold mb-2">
                        제 3조 (환불 절차)
                      </Text>
                      <Text style={{ color: THEMES[appTheme].text }} className="leading-7 opacity-60 text-sm">
                        인앱 결제 상품의 환불은 각 스토어 관리 방침에 따라 결정되므로, 사용자는 스토어 고객센터를 통해
                        직접 환불 요청을 진행하셔야 합니다.
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="pt-10 border-t border-white/5">
                  <Text
                    style={{ color: THEMES[appTheme].text }}
                    className="text-[10px] italic leading-5 opacity-30 text-center"
                  >
                    공고일: 2026년 2월 20일{"\n"}시행일: 2026년 2월 20일{"\n\n"}너울(Swell)은 항상 사용자와의 신뢰를
                    바탕으로 투명하게 운영하겠습니다.
                  </Text>
                </View>
              </View>
              <View className="h-20" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SettingsScreen;
