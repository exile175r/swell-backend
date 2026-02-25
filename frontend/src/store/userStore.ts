import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserStatus = "GUEST" | "USER" | "VIP";

interface UserState {
  status: UserStatus;
  userId: string | null; // 사용자 고유 식별자 추가
  nickname: string;
  lastNicknameUpdate: string | null; // "YYYY-MM-DD"
  isInitialNickname: boolean;
  dailyFreeTokens: number;
  totalTokens: number;
  lastUsedDate: string;
  viewedPostsCount: number;
  hasSeenGuide: boolean;
  lastGuidelineDate: string | null; // "YYYY-MM-DD"
  isGlobalLoading: boolean;
  blockedUsers: { id: string; nickname: string; blockedAt: string }[];
  following: { id: string; nickname: string }[]; // 팔로우 중인 사용자 정보 목록 (ID, 닉네임)
  appTheme: "midnight" | "ocean" | "sunset" | "forest"; // 앱 테마 상태 추가
  notificationsEnabled: boolean; // 푸시 알림 설정
  isSecretModeActive: boolean; // 시크릿 모드(잠금) 활성화 여부
  appPassword: string | null; // 앱 비밀번호 (4자리 숫지)
  isMarketingAccepted: boolean; // 마케팅 정보 수신 동의 여부
  penalty: {
    level: number; // 0: 정상, 1: 주의, 2: 작성제한, 3: 정지
    expiresAt: string | null; // 제재 만료일 (ISO String)
    reason: string | null;
  };
  reportCounts: Record<string, number>; // [postId]: count
  userReportCounts: Record<string, number>; // [userId]: count (회원 신고 누적)
  myReportedPostIds: string[]; // 내가 신고한 게시글 ID 목록
  myReportedUserIds: string[]; // 내가 신고한 회원 ID 목록
  birthYear: string | null; // 사용자 생년

  // Actions
  setStatus: (status: UserStatus) => void;
  setUserId: (id: string | null) => void;
  setNickname: (newNickname: string) => { success: boolean; message: string };
  checkNicknameAvailability: (newNickname: string) => { available: boolean; message: string };
  setHasSeenGuide: (seen: boolean) => void;
  setGuidelineSeen: () => void;
  setGlobalLoading: (loading: boolean) => void;
  setAppTheme: (theme: "midnight" | "ocean" | "sunset" | "forest") => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  reportPost: (postId: string) => { success: boolean; message: string }; // 게시글 신고
  reportUser: (userId: string, reason: string) => { success: boolean; message: string }; // 회원 신고
  setPenalty: (level: number, days: number, reason: string) => void; // 제재 액션
  blockUser: (id: string, nickname: string) => void;
  unblockUser: (id: string) => void;
  useToken: () => boolean;
  toggleFollow: (userId: string, nickname?: string) => void;
  buyTokens: (amount: number) => void;
  addViewedPost: () => boolean;
  resetDaily: () => void;
  addTokenByAd: () => void;
  upgradeToVIP: () => void;
  setBirthYear: (year: string) => void;
  setSecretMode: (active: boolean) => void;
  setAppPassword: (password: string | null) => void;
  setMarketingAccepted: (accepted: boolean) => void;
  resetStore: () => void;
}

const generateRandomNickname = () => {
  const adjs = ["푸른", "고요한", "깊은", "잔잔한", "거친", "은은한", "시원한", "따뜻한"];
  const nouns = ["파도", "너울", "바다", "물결", "해변", "진심", "마음", "눈물"];
  return `${adjs[Math.floor(Math.random() * adjs.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(1000 + Math.random() * 9000)}`;
};

/**
 * @description 사용자 등급 및 가상 화폐(토큰) 관리를 위한 Zustand Store
 */
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      status: "GUEST",
      userId: `guest_${Math.random().toString(36).substring(2, 11)}`,
      nickname: generateRandomNickname(),
      lastNicknameUpdate: null,
      isInitialNickname: true,
      dailyFreeTokens: 10,
      totalTokens: 0,
      lastUsedDate: new Date().toISOString().split("T")[0],
      viewedPostsCount: 0,
      hasSeenGuide: false,
      lastGuidelineDate: null,
      isGlobalLoading: false,
      blockedUsers: [],
      following: [],
      appTheme: "midnight",
      notificationsEnabled: true,
      isSecretModeActive: false,
      appPassword: null,
      isMarketingAccepted: false,
      penalty: {
        level: 0,
        expiresAt: null,
        reason: null,
      },
      reportCounts: {},
      userReportCounts: {},
      myReportedPostIds: [],
      myReportedUserIds: [],
      birthYear: null,

      setStatus: (status) => set({ status }),
      setUserId: (id) => set({ userId: id }),
      setHasSeenGuide: (seen) => set({ hasSeenGuide: seen }),
      setGuidelineSeen: () => set({ lastGuidelineDate: new Date().toISOString().split("T")[0] }),
      setGlobalLoading: (loading: boolean) => set({ isGlobalLoading: loading }),
      setAppTheme: (theme) => set({ appTheme: theme }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setBirthYear: (year) => set({ birthYear: year }),
      setSecretMode: (active) => set({ isSecretModeActive: active }),
      setAppPassword: (password) => set({ appPassword: password }),
      setMarketingAccepted: (accepted) => set({ isMarketingAccepted: accepted }),

      reportPost: (postId: string) => {
        const { myReportedPostIds } = get();
        if (myReportedPostIds.includes(postId)) {
          return { success: false, message: "이미 신고한 게시글입니다." };
        }

        set((state) => {
          const currentCount = state.reportCounts[postId] || 0;
          return {
            reportCounts: {
              ...state.reportCounts,
              [postId]: currentCount + 1,
            },
            myReportedPostIds: [...state.myReportedPostIds, postId],
          };
        });
        return { success: true, message: "게시글 신고가 접수되었습니다." };
      },

      setPenalty: (level, days, reason) => {
        const expiresAt = days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null;
        set({ penalty: { level, expiresAt, reason } });
      },

      reportUser: (targetUserId, reason) => {
        const { myReportedUserIds } = get();
        if (myReportedUserIds.includes(targetUserId)) {
          return { success: false, message: "이미 신고한 회원입니다." };
        }

        set((state) => {
          const currentCount = (state.userReportCounts[targetUserId] || 0) + 1;
          const nextUserReportCounts = { ...state.userReportCounts, [targetUserId]: currentCount };
          const nextMyReportedUserIds = [...state.myReportedUserIds, targetUserId];

          // 패널티 판정 로직은 추후 백엔드에서 전담하고,
          // 프론트엔드는 서버에서 전달받은 상태(status: "BANNED" 등)만 반영하도록 가볍게 관리합니다.

          return { userReportCounts: nextUserReportCounts, myReportedUserIds: nextMyReportedUserIds };
        });

        return { success: true, message: "회원 신고가 접수되었습니다." };
      },

      blockUser: (id, nickname) => {
        const { blockedUsers } = get();
        if (blockedUsers.find((u) => u.id === id)) return;

        const now = new Date();
        const blockedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

        set({
          blockedUsers: [...blockedUsers, { id, nickname, blockedAt }],
        });
      },

      unblockUser: (id) => {
        set((state) => ({
          blockedUsers: state.blockedUsers.filter((u) => u.id !== id),
        }));
      },

      toggleFollow: (userId: string, nickname?: string) => {
        set((state) => {
          const isFollowing = state.following.some((f) => f.id === userId);
          const nextFollowing = isFollowing
            ? state.following.filter((f) => f.id !== userId)
            : [...state.following, { id: userId, nickname: nickname || "알 수 없는 파도" }];
          return { following: nextFollowing };
        });
      },

      setNickname: (newNickname) => {
        const { nickname, isInitialNickname, lastNicknameUpdate } = get();
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        // 1. 기존과 동일한지 확인
        if (newNickname === nickname) {
          return { success: false, message: "기존 닉네임과 동일합니다." };
        }

        // 2. 중복 체크 (데모용 가상 DB)
        const TAKEN_NICKNAMES = ["지친신입사원", "알바몬24시", "숨쉬고싶다", "파도타는자", "모래알"];
        if (TAKEN_NICKNAMES.includes(newNickname)) {
          return { success: false, message: "중복된 닉네임입니다." };
        }

        // 3. 30일 제한 체크
        if (!isInitialNickname && lastNicknameUpdate) {
          const lastUpdate = new Date(lastNicknameUpdate);
          const diffTime = Math.abs(today.getTime() - lastUpdate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 30) {
            return {
              success: false,
              message: `마지막 수정 후 30일이 지나지 않아 닉네임 변경이 불가합니다. (남은 기간: ${30 - diffDays}일)`,
            };
          }
        }

        set({
          nickname: newNickname,
          isInitialNickname: false,
          lastNicknameUpdate: todayStr,
        });

        return { success: true, message: "닉네임이 변경되었습니다." };
      },

      checkNicknameAvailability: (newNickname) => {
        const { nickname, isInitialNickname, lastNicknameUpdate } = get();
        const today = new Date();

        if (newNickname.trim().length < 2) {
          return { available: false, message: "최소 2자 이상 입력해주세요." };
        }

        if (newNickname === nickname) {
          return { available: true, message: "현재 사용 중인 닉네임입니다." };
        }

        const TAKEN_NICKNAMES = ["지친신입사원", "알바몬24시", "숨쉬고싶다", "파도타는자", "모래알"];
        if (TAKEN_NICKNAMES.includes(newNickname)) {
          return { available: false, message: "이미 사용 중인 닉네임입니다." };
        }

        if (!isInitialNickname && lastNicknameUpdate) {
          const lastUpdate = new Date(lastNicknameUpdate);
          const diffTime = Math.abs(today.getTime() - lastUpdate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 30) {
            return {
              available: false,
              message: `변경 후 30일이 지나야 재변경 가능합니다. (${30 - diffDays}일 남음)`,
            };
          }
        }

        return { available: true, message: "사용 가능한 닉네임입니다." };
      },

      useToken: () => {
        const { status, dailyFreeTokens, totalTokens, resetDaily } = get();

        // 날짜 체크 및 초기화
        resetDaily();

        if (status === "VIP") return true;
        if (status === "GUEST") return false;

        // 1. 무료 토큰 먼저 소진
        if (get().dailyFreeTokens > 0) {
          set((state) => ({ dailyFreeTokens: state.dailyFreeTokens - 1 }));
          return true;
        }

        // 2. 유료 토큰 소진
        if (get().totalTokens > 0) {
          set((state) => ({ totalTokens: state.totalTokens - 1 }));
          return true;
        }

        return false;
      },

      buyTokens: (amount) => {
        set((state) => ({
          totalTokens: state.totalTokens + amount,
          status: state.status === "GUEST" ? "USER" : state.status,
        }));
      },

      upgradeToVIP: () => {
        set({ status: "VIP" });
      },

      addViewedPost: () => {
        const { status, viewedPostsCount } = get();
        if (status !== "GUEST") return true;

        if (viewedPostsCount < 3) {
          set((state) => ({ viewedPostsCount: state.viewedPostsCount + 1 }));
          return true;
        }
        return false;
      },

      addTokenByAd: () => {
        set((state) => ({ totalTokens: state.totalTokens + 1 }));
      },

      resetDaily: () => {
        const today = new Date().toISOString().split("T")[0];
        const { lastUsedDate } = get();

        if (lastUsedDate !== today) {
          set({
            lastUsedDate: today,
            dailyFreeTokens: 10,
            viewedPostsCount: 0,
          });
        }
      },

      resetStore: () => {
        set({
          status: "GUEST",
          nickname: generateRandomNickname(),
          lastNicknameUpdate: null,
          isInitialNickname: true,
          dailyFreeTokens: 10,
          totalTokens: 0,
          lastUsedDate: new Date().toISOString().split("T")[0],
          viewedPostsCount: 0,
          hasSeenGuide: false,
          lastGuidelineDate: null,
          isGlobalLoading: false,
          userId: null,
          blockedUsers: [],
          following: [],
          appTheme: "midnight",
          notificationsEnabled: true,
          penalty: { level: 0, expiresAt: null, reason: null },
          reportCounts: {},
          userReportCounts: {},
          myReportedPostIds: [],
          myReportedUserIds: [],
          birthYear: null,
          isSecretModeActive: false,
          appPassword: null,
          isMarketingAccepted: false,
        });
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
