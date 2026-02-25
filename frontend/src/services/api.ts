/**
 * @description Swell API 서비스 유틸리티 (Actual Backend Integration)
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? "http://10.0.2.2:3000" : "https://swell-backend.onrender.com");
const BASE_URL_FASTAPI = process.env.EXPO_PUBLIC_FASTAPI_URL || "http://localhost:8000";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  // 게시글 관련
  posts: {
    // 목록 조회
    get: async (page = 1, limit = 20, filter = "all") => {
      try {
        const response = await fetch(`${BASE_URL}/api/posts?page=${page}&limit=${limit}&filter=${filter}`);
        const data = await response.json();
        // 백엔드 명세에 맞춰 데이터 파싱 (성공 시 data.posts 또는 data.data 확인 필요)
        return data.success ? data.posts || data.data || [] : [];
      } catch (error) {
        console.error("API Get Posts Error:", error);
        return [];
      }
    },
    // 작성
    create: async (data: {
      content: string;
      title?: string;
      category?: string;
      nickname?: string;
      hasVote?: boolean;
      userId: string;
    }) => {
      try {
        const response = await fetch(`${BASE_URL}/api/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    // 삭제
    delete: async (id: string) => {
      try {
        const response = await fetch(`${BASE_URL}/api/posts/${id}`, { method: "DELETE" });
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    // 수정
    update: async (id: string, data: { title?: string; content: string }) => {
      try {
        const response = await fetch(`${BASE_URL}/api/posts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    // 반응 (좋아요/싫어요)
    react: async (id: string, type: "like" | "dislike", userId: string) => {
      try {
        const response = await fetch(`${BASE_URL}/api/posts/${id}/reaction`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, userId }),
        });
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    // 투표 (찬성/반대)
    vote: async (id: string, voteType: "agree" | "disagree", userId: string) => {
      try {
        const response = await fetch(`${BASE_URL}/api/posts/${id}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voteType, userId }),
        });
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    // 콘텐츠 필터링 (FASTAPI 연동 - 기존 유지)
    filter: async (text: string) => {
      try {
        const response = await fetch(`${BASE_URL_FASTAPI}/api/filter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        return await response.json();
      } catch (error) {
        return { is_blocked: false, action: "pass", message: "Filter service unavailable" };
      }
    },
  },

  // 댓글 관련
  comments: {
    // 작성
    create: async (postId: string, data: { content: string; userId: string; parentId?: number | string }) => {
      try {
        const response = await fetch(`${BASE_URL}/api/posts/${postId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    // 삭제
    delete: async (commentId: string) => {
      try {
        const response = await fetch(`${BASE_URL}/api/comments/${commentId}`, { method: "DELETE" });
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    // 댓글 좋아요
    like: async (commentId: string, userId: string) => {
      try {
        const response = await fetch(`${BASE_URL}/api/comments/${commentId}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
  },

  // 알람 관련
  notifications: {
    get: async (userId: string) => {
      try {
        const response = await fetch(`${BASE_URL}/api/notifications?userId=${userId}`);
        const data = await response.json();
        return data.success ? data.notifications || data.data || [] : [];
      } catch (error) {
        return [];
      }
    },
  },

  // AI/STT 관련
  stt: {
    recognize: async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/stt`, { method: "POST" });
        return await response.json();
      } catch (error) {
        return { text: "오늘 하루는 정말 긴 파도 같았어요..." };
      }
    },
    summarize: async (text: string) => {
      try {
        // 실제 API가 구현되기 전까지는 데모용 응답 반환 (또는 FastAPI 연동 가능)
        // const response = await fetch(`${BASE_URL}/api/stt/summarize`, { ... });
        await sleep(1000); // 작업 중임을 시뮬레이션
        return {
          success: true,
          summary: `[AI 요약] "${text.substring(0, 30)}..."에 대한 깊은 공감과 위로의 분석이 완료되었습니다.`,
        };
      } catch (error) {
        throw error;
      }
    },
  },

  // 인증 관련
  auth: {
    socialLogin: async (provider: string, accessToken: string, redirectUri: string, codeVerifier?: string) => {
      try {
        const response = await fetch(`${BASE_URL}/api/auth/social`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, accessToken, redirectUri, codeVerifier }),
        });
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    register: async (data: {
      email?: string;
      nickname: string;
      gender: string;
      platform: string;
      birthYear: string;
      birthMonth: string;
      socialId?: string;
    }) => {
      try {
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    verifyAdult: async (birthDate: string) => {
      try {
        const response = await fetch(`${BASE_URL}/api/auth/verify-adult`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ birthDate }),
        });
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
  },

  // 사용자/팔로우 관련
  users: {
    // 상대방 프로필 정보 조회
    getProfile: async (userId: string) => {
      try {
        const response = await fetch(`${BASE_URL}/api/users/profile/${userId}`);
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    // 팔로우 토글 (Swagger: /api/users/follow 엔드포인트 하나로 팔로우/언팔로우 처리)
    toggleFollow: async (followerId: string, followingId: string) => {
      try {
        const response = await fetch(`${BASE_URL}/api/users/follow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followerId, followingId }),
        });
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    follow: (followerId: string, followingId: string) => api.users.toggleFollow(followerId, followingId),
    unfollow: (followerId: string, followingId: string) => api.users.toggleFollow(followerId, followingId),
    syncProfile: async (userId: string, nickname: string) => {
      try {
        const response = await fetch(`${BASE_URL}/api/users/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, nickname }),
        });
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    // 활동 기록 삭제
    deleteHistory: async (userId: string) => {
      try {
        const response = await fetch(`${BASE_URL}/api/users/${userId}/history`, {
          method: "DELETE",
        });
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    // 탈퇴
    withdraw: async (userId: string) => {
      try {
        const response = await fetch(`${BASE_URL}/api/users/${userId}`, {
          method: "DELETE",
        });
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
  },
};
