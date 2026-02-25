import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator, Dimensions, Alert } from "react-native";
import { CheckSquare, Square, X, MessageCircle, Waves } from "lucide-react-native";
import { Linking } from "react-native";
import WaveLogo from "../components/WaveLogo";
import { useGlobalLoader } from "../hooks/useGlobalLoader";
import { useUserStore } from "../store/userStore";
import { THEMES } from "../styles/theme";
import { api } from "../services/api";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

/**
 * @description 소셜 로그인 연동 중심의 로그인 화면
 */
const LoginScreen = ({ navigation }: any) => {
  const [isAutoLogin, setIsAutoLogin] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { startLoading, stopLoading } = useGlobalLoader();
  const { setStatus, setUserId, setNickname, nickname, hasSeenGuide, appTheme } = useUserStore();

  // 카카오/구글 콘솔의 리다이렉트 URI 제약(HTTP/HTTPS 강제)을 우회하기 위한 프록시 URL
  // 앱(프론트엔드)은 이 HTTP 주소로 보냅니다 -> 백엔드(/api/auth/callback)가 받음 -> 백엔드가 강제로 앱(swell://oauth)으로 던짐
  const PROXY_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/auth/callback`;

  const redirectUri = PROXY_URL;

  // 인앱 브라우저가 돌아올 때 받을 딥링크 주소를 리스너에 명시 (백엔드가 여기로 던지면 앱이 잡음)
  const returnUrl = AuthSession.makeRedirectUri({
    scheme: "swell",
    path: "oauth",
  });

  console.log("[Auth] Setup -> Proxy:", redirectUri, " / Native Return:", returnUrl);

  // 카카오 로그인 요청 설정
  const [kakaoRequest, kakaoResponse, promptKakaoAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_KAKAO_CLIENT_ID || "",
      scopes: ["profile_nickname"],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    { authorizationEndpoint: "https://kauth.kakao.com/oauth/authorize" }
  );

  // 구글 로그인 요청 설정
  const [googleRequest, googleResponse, promptGoogleAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "",
      scopes: ["profile", "email"],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    { authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth" }
  );

  const googleVerifierRef = React.useRef<string | null>(null);
  const kakaoVerifierRef = React.useRef<string | null>(null);
  const activePlatformRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (kakaoRequest?.codeVerifier) {
      kakaoVerifierRef.current = kakaoRequest.codeVerifier;
      console.log("[Auth] Kakao Code Verifier Captured");
    }
  }, [kakaoRequest]);

  useEffect(() => {
    if (googleRequest?.codeVerifier) {
      googleVerifierRef.current = googleRequest.codeVerifier;
      console.log("[Auth] Google Code Verifier Captured");
    }
  }, [googleRequest]);

  // 1. 딥링크 직접 수신 리스너 (보험용)
  useEffect(() => {
    const handleUrl = async (url: string) => {
      console.log("[Auth] Deep Link Detected:", url);
      if (url.includes("swell://oauth")) {
        const query = url.split("?")[1];
        if (query) {
          // URLSearchParams가 지원되지 않을 수 있으므로 수동 파싱
          const params: Record<string, string> = {};
          query.split("&").forEach(part => {
            const parts = part.split("=");
            const key = parts[0];
            const value = parts[1] ? decodeURIComponent(parts[1]) : "";
            params[key] = value;
          });

          if (params.code) {
            console.log("[Auth] Code found in deep link, processing...");
            const provider = activePlatformRef.current || (url.includes("google") ? "google" : "kakao");
            // Ref에서 직접 추출 (상태 지연 방지)
            const verifier = provider === "kakao" ? kakaoVerifierRef.current : googleVerifierRef.current;
            handleAuthComplete(provider, params.code, verifier || undefined);
          }
        }
      }
    };

    // 앱이 꺼져있을 때 딥링크로 켜진 경우
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    // 앱이 켜져있을 때 딥링크가 온 경우
    const subscription = Linking.addEventListener("url", (event) => {
      handleUrl(event.url);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (kakaoResponse?.type === "success" && kakaoResponse.params.code) {
      handleAuthComplete("kakao", kakaoResponse.params.code, kakaoVerifierRef.current || undefined);
    } else if (kakaoResponse?.type === "error") {
      console.log("[Kakao Auth Error]", kakaoResponse.error);
      Alert.alert("로그인 실패", kakaoResponse.error?.message || "카카오 로그인에 실패했습니다.");
    }
  }, [kakaoResponse]);

  useEffect(() => {
    if (googleResponse?.type === "success" && googleResponse.params.code) {
      handleAuthComplete("google", googleResponse.params.code, googleVerifierRef.current || undefined);
    } else if (googleResponse?.type === "error") {
      console.log("[Google Auth Error]", googleResponse.error);
      Alert.alert("로그인 실패", googleResponse.error?.message || "Google 로그인에 실패했습니다.");
    }
  }, [googleResponse]);

  /**
   * @description 소셜 로그인 버튼 클릭 시 실행
   */
  const handleSocialLogin = async (platform: string) => {
    activePlatformRef.current = platform; // 현재 시도 중인 플랫폼 기억
    if (platform === "kakao") {
      console.log("[Auth] Kakao Login Attempt (Production Flow):", { redirectUri });
      await promptKakaoAsync();
    } else if (platform === "google") {
      const currentClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";
      console.log("[Auth] Google Login Attempt (Production Flow):", { currentClientId, redirectUri });
      await promptGoogleAsync();
    }
  };

  const isProcessingRef = React.useRef(false);

  /**
   * @description 실제 인증 코드 백엔드 전송
   */
  const handleAuthComplete = async (provider: string, accessToken: string, codeVerifier?: string) => {
    if (isProcessingRef.current) {
      console.log("[Auth] Already processing a login request, skipping...");
      return;
    }

    try {
      isProcessingRef.current = true;
      setIsLoggingIn(true);
      console.log(`[Auth] handleAuthComplete triggered for ${provider}. PKCE: ${!!codeVerifier}`);
      console.log(`[Auth] Using Redirect URI for verification: ${redirectUri}`);
      startLoading(500);

      const response = await api.auth.socialLogin(provider, accessToken, redirectUri, codeVerifier);
      console.log(`[Auth] Backend Response for ${provider}:`, response.success);

      if (response.success && response.user) {
        setStatus(response.user.status || "USER");
        setUserId(response.user.id);
        if (response.user.nickname) setNickname(response.user.nickname);

        if (hasSeenGuide) {
          // 가이드인 경우 홈으로
          navigation.reset({
            index: 0,
            routes: [{ name: "Home" }],
          });
        } else {
          // 가이드가 처음인 경우 가이드로
          navigation.replace("Guide");
        }
      } else if (response.error === "NOT_REGISTERED") {
        Alert.alert("미등록 계정", "등록되지 않은 계정입니다.\n아직 회원이 아니신가요?", [
          { text: "취소", style: "cancel" },
          {
            text: "회원가입하기",
            onPress: () => navigation.navigate("Register", { socialData: response.socialData }),
            style: "default",
          },
        ]);
      } else {
        Alert.alert("로그인 실패", response.message || "로그인 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("[Login Error]", error);
      Alert.alert("오류", "서버와의 통신이 원활하지 않습니다.");
    } finally {
      setIsLoggingIn(false);
      stopLoading();
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: THEMES[appTheme].bg }} className="flex-1">
      {/* 배경 장식 */}
      <View
        style={{ backgroundColor: THEMES[appTheme].accent + "1A" }}
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl"
      />
      <View
        style={{ backgroundColor: THEMES[appTheme].accent + "0D" }}
        className="absolute top-1/2 -left-32 w-64 h-64 rounded-full blur-3xl"
      />

      <View className="flex-1 px-8 justify-center">
        <View className="mb-12 pt-10 items-center">
          <View
            style={{ backgroundColor: THEMES[appTheme].accent + "1A" }}
            className="w-28 h-28 rounded-[40px] items-center justify-center border border-white/5 shadow-2xl mb-8"
          >
            <WaveLogo size={60} color={THEMES[appTheme].accent} />
          </View>
          <Text
            style={{ color: THEMES[appTheme].text }}
            className="text-[44px] font-black leading-tight tracking-tighter text-center"
          >
            너울
          </Text>
        </View>

        <View className="mb-14 items-center">
          <Text
            style={{ color: THEMES[appTheme].text }}
            className="opacity-40 text-center text-base leading-7 font-medium"
          >
            정제되지 않은 진심을 쏟아내는{"\n"}익명 성인 커뮤니티
          </Text>
        </View>

        {/* Social Buttons Section */}
        <View className="space-y-4 mb-10">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSocialLogin("kakao")}
            disabled={isLoggingIn}
            className="bg-[#FEE500] h-[68px] rounded-[28px] flex-row items-center justify-center shadow-2xl mb-5"
          >
            {isLoggingIn ? (
              <ActivityIndicator color="#191919" />
            ) : (
              <Text className="text-[#191919] text-xl font-bold">카카오톡 로그인</Text>
            )}
          </TouchableOpacity>

          {/* 개발용 테스트 로그인 버튼 */}
          {__DEV__ && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleAuthComplete("test", "test_code")}
              disabled={isLoggingIn}
              style={{ borderColor: THEMES[appTheme].accent, borderStyle: "dashed" }}
              className="h-[60px] rounded-[28px] flex-row items-center justify-center border mb-10"
            >
              <Text style={{ color: THEMES[appTheme].accent }} className="text-lg font-bold">
                [Dev] API 연결 테스트 (Bypass)
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleSocialLogin("google")}
            disabled={isLoggingIn}
            className="bg-white h-[68px] rounded-[28px] flex-row items-center justify-center shadow-2xl mb-10"
          >
            {isLoggingIn ? (
              <ActivityIndicator color="#191919" />
            ) : (
              <Text className="text-[#191919] text-xl font-bold">Google 로그인</Text>
            )}
          </TouchableOpacity>

          {/* Auto Login Checkbox */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsAutoLogin(!isAutoLogin)}
            className="flex-row items-center justify-center py-2"
          >
            <View className="mr-2">
              {isAutoLogin ? (
                <CheckSquare size={20} color={THEMES[appTheme].accent} />
              ) : (
                <Square size={20} color={THEMES[appTheme].text} opacity={0.3} />
              )}
            </View>
            <Text
              style={{ color: isAutoLogin ? THEMES[appTheme].accent : THEMES[appTheme].text + "4D" }}
              className="text-sm font-medium"
            >
              자동 로그인 유지하기
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Links */}
        <View className="flex-row items-center justify-center">
          <Text style={{ color: THEMES[appTheme].text }} className="opacity-30 text-sm">
            계정이 없으신가요?
          </Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "회원가입 안내",
                "위의 '카카오톡 로그인' 또는 'Google 로그인' 버튼을 눌러주세요. 등록되지 않은 계정이라면 간편 회원가입으로 자동 연결됩니다.",
              )
            }
            className="ml-2"
          >
            <Text
              style={{ color: THEMES[appTheme].accent, borderBottomColor: THEMES[appTheme].accent + "4D" }}
              className="text-sm font-bold border-b"
            >
              회원가입하고 시작하기
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
