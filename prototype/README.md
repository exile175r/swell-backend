🌊 너울 (Swell) Frontend Prototype Setup

백엔드 API 개발 테스트를 위한 프론트엔드 클라이언트 실행 가이드입니다.

1. 사전 준비 (Prerequisites)
Node.js: v18.0.0 이상 설치 (다운로드)
Terminal: Git Bash, PowerShell, 또는 Terminal

2. 프로젝트 생성 및 의존성 설치
터미널에서 아래 명령어를 순서대로 입력하세요.

# 1. Vite를 사용하여 React 프로젝트 생성
npm create vite@latest swell-client -- --template react

# 2. 프로젝트 폴더로 이동
cd swell-client

# 3. 필수 라이브러리 설치 (UI 아이콘 및 스타일링)
npm install lucide-react

# 4. Tailwind CSS 설치 및 초기화
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

3. Tailwind CSS 설정
tailwind.config.js 파일을 열고 content 배열을 아래와 같이 수정합니다.

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: 'class', // 다크모드 활성화
}

src/index.css 파일의 모든 내용을 지우고 아래 3줄을 붙여넣습니다.

@tailwind base;
@tailwind components;
@tailwind utilities;

4. 코드 적용
제공받은 App.jsx 코드 전체를 복사합니다.
프로젝트의 src/App.jsx 파일을 열고 기존 내용을 모두 지운 뒤 붙여넣기 합니다.

5. 실행
npm run dev

브라우저에서 http://localhost:5173 으로 접속하면 프로토타입 앱을 확인할 수 있습니다.백엔드 서버(localhost:8080)가 켜져 있지 않으면 Mock Data 모드로 동작합니다.