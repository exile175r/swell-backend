# 🌊 Swell 소셜 로그인 오류 분석 및 수정 가이드

프론트엔드(`Swell-client`)와 백엔드(`Swell`) 간의 데이터 통신 규격 및 인증 방식 불일치를 해결하기 위한 가이드입니다. 프론트엔드 개발자분께 이 내용을 전달해 주세요.

---

## 🚩 주요 에러 원인

1.  **파라미터 명칭 불일치**: 백엔드는 `provider`를 기대하지만 프론트는 `platform`을 보냄.
2.  **전달 데이터 종류 불일치**: 백엔드는 `Token`을 기대하지만 프론트는 인증 직후의 `Code`를 보냄.
3.  **구글 인증 방식**: 백엔드는 구글 `ID Token` 검증 방식을 사용하므로, 프론트에서도 `id_token`을 추출해서 보내야 함.

---

## 🛠 수정 요청 사항 (프론트엔드)

### 1. API 서비스 코드 수정 (`src/services/api.ts`)
백엔드 컨트롤러 명세에 맞게 JSON 바디의 필드명을 변경해야 합니다.

```typescript
// [파일 위치] src/services/api.ts
auth: {
  socialLogin: async (provider: string, accessToken: string, redirectUri: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // platform -> provider, code -> accessToken으로 명칭 변경
        body: JSON.stringify({ provider, accessToken, redirectUri }),
      });
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
  // ...
}
```

### 2. 로그인 로직 수정 (`src/screens/LoginScreen.tsx`)
인가 코드(`code`)가 아닌, 소셜 서버로부터 발급받은 실제 **토큰**을 백엔드에 전달해야 합니다.

-   **카카오**: `AuthSession` 결과에서 `code`를 서버로 보낼 `access_token`으로 교환 후 전달 (또는 `responseType: "token"` 사용 고려)
-   **구글**: `AuthSession` 결과에서 `id_token`을 추출하여 백엔드의 `accessToken` 필드에 담아 전달

> [!IMPORTANT]
> **백엔드 소스 코드 참고 (`Swell/src/controllers/auth.controller.ts:13`)**
> ```typescript
> // 백엔드는 아래와 같이 데이터를 구조분해 할당하여 사용 중입니다.
> const { provider, accessToken } = req.body;
> ```

---

## 🔍 체크리스트
- [ ] 프론트엔드에서 `/api/auth/social` 호출 시 `provider` 값이 "google" 또는 "kakao"인지 확인
- [ ] 구글 로그인의 경우, 전달하는 값이 `id_token` 형태인지 확인
- [ ] 백엔드 `.env`의 `GOOGLE_CLIENT_ID`와 프론트엔드의 `clientId`가 동일한 구글 클라우드 프로젝트 소속인지 확인
