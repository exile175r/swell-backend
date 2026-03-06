# 🌊 Swell 소셜 로그인 오류 분석 및 수정 가이드

프론트엔드(`Swell-client`)와 백엔드(`Swell`) 간의 데이터 통신 규격 및 인증 방식 불일치를 해결하기 위한 가이드입니다. 프론트엔드 개발자분께 이 내용을 전달해 주세요.

---

## 🚩 주요 에러 원인

1.  **데이터 명칭 불일치**: 백엔드는 인가 코드를 `code`라는 필드로 받기로 변경했습니다 (이전 `accessToken`). 프론트에서는 `platform` 대신 `provider`를 보내야 합니다.
2.  **전달해야 할 데이터**: 백엔드에서 자체적으로 토큰 교환(Token Exchange)을 수행합니다. 따라서 프론트엔드는 인증 서버로부터 받은 **실제 토큰(access_token, id_token)** 대신 **인가 코드(Authorization Code)**를 백엔드에 넘겨주어야 합니다.

---

## 🛠 수정 요청 사항 (프론트엔드)

### 1. API 서비스 코드 수정 (`src/services/api.ts`)
백엔드 컨트롤러 명세에 맞게 JSON 바디 필드명을 변경하고, 인가 코드(`code`)를 전달해야 합니다.

```typescript
// [파일 위치] src/services/api.ts
auth: {
  socialLogin: async (provider: string, code: string, redirectUri: string, codeVerifier?: string) => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // provider: 'kakao' 또는 'google'
        // code: 인가 코드 (Authorization Code)
        body: JSON.stringify({ provider, code, redirectUri, codeVerifier }),
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
프론트엔드에서 발급 받은 **인가 코드(Authorization Code)** 자체를 백엔드에 보내야 합니다.

-   **카카오/구글**: `AuthSession` 진행 시 토큰을 직접 교환하는 것이 아니라, 인가 코드가 반환되면 그 **`code`** 값을 백엔드에 전달합니다. (추가적으로 `redirectUri`와 PKCE에 사용한 `codeVerifier`가 있다면 함께 전달)

> [!IMPORTANT]
> **백엔드 소스 코드 변경 안내 (`Swell/src/controllers/auth.controller.ts`)**
> 백엔드에서는 전달된 `code`를 활용해 카카오/구글 서버에서 직접 토큰을 발급받고 유저 정보를 확인합니다.
> ```typescript
> // 백엔드는 아래와 같이 데이터를 받아 처리합니다.
> const { provider, code, redirectUri, codeVerifier } = req.body;
> ```

---

## 🔍 체크리스트
- [ ] 프론트엔드에서 `/api/auth/social` 호출 시 `body`에 `provider`, `code` 정보가 포함되어 있는지 확인
- [ ] `provider` 값이 "google" 또는 "kakao"인지 확인
- [ ] 구글 및 카카오 로그인 시 실제 토큰(id_token이나 access_token)이 아닌 인가 코드(`code`)를 보내고 있는지 확인
- [ ] 백엔드와 동일하게 토큰 교환을 위한 `redirectUri` 환경이 올바르게 맞춰져 있는지 확인
