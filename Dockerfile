# Node.js 20 이미지를 기반으로 설정
FROM node:20

# Python 및 FFmpeg 설치
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 의존성 파일 복사 (Node.js & Python)
COPY package*.json ./
COPY requirements.txt ./

# Node.js 패키지 설치
RUN npm install

# Python 패키지 설치
RUN python3 -m pip install --upgrade pip
RUN python3 -m pip install -r requirements.txt

# 소스 코드 복사
COPY . .

# Prisma Client 생성 및 TypeScript 빌드
RUN npx prisma generate
RUN npm run build

# 포트 개방
EXPOSE 10000

# 서버 실행
CMD ["npm", "run", "start"]
