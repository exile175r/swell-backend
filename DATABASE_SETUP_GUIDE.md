# Swell 데이터베이스 구축 및 트러블슈팅 가이드

이 문서는 Swell 프로젝트의 백엔드 개발을 위해 데이터베이스를 처음 세팅하거나, 다른 팀원에게 환경을 공유할 때 참고하는 가이드입니다.

---

## 1. 전제 조건
- **MySQL 8.0 이상** 설치 권장
- **MySQL Workbench** 또는 선호하는 DB 관리 도구 준비

## 2. 데이터베이스 초기화 순서

Prisma CLI 자동 마이그레이션이 제한적인 환경(로컬 인증 이슈 등)에서는 아래 파일을 순서대로 Workbench에서 실행하여 안정적으로 DB를 구축합니다.

### Step 1: 전체 테이블 생성
- **파일**: `prisma/init_sql/full_init.sql`
- **설명**: `User`, `Post`, `Comment`, `Notification` 등 사이트의 모든 테이블 구조를 한 번에 생성합니다.

### Step 2: 초기 데이터(Seed) 삽입
- **파일**: `prisma/init_sql/seed_data.sql`
- **설명**: 테스트용 관리자 계정('너울테스터')과 환영 메시지를 삽입하여 즉시 기능을 확인합니다.

---

## 3. 주요 트러블슈팅: 인증 플러그인 이슈

MySQL 8.0+ 환경에서 Node.js/Prisma 연결 시 `Unknown authentication plugin 'sha256_password'` 에러가 발생할 경우 아래 조치를 취해야 합니다.

### 해결 방법 (Workbench에서 실행)
사용 중인 DB 계정의 인증 방식을 노드 드라이버가 인식 가능한 방식으로 변경합니다.

```sql
-- 1. 현재 사용자 확인
SELECT user, host, plugin FROM mysql.user;

-- 2. 인증 방식 변경 (root 또는 본인의 계정명 사용)
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '실제비밀번호';

-- 3. 변경 사항 반영
FLUSH PRIVILEGES;
```

## 4. 환경 변수 설정 (.env)
백엔드 서버 루트의 `.env` 파일을 본인의 DB 환경에 맞게 수정해야 서버 가동이 가능합니다.

```env
# 형식: mysql://[사용자]:[비밀번호]@[호스트]:[포트]/[스키마명]
DATABASE_URL="mysql://root:실제비밀번호@localhost:3306/mydb"
```

---
> [!TIP]
> **협업 시 주의사항**: 새로운 테이블을 추가하거나 기존 구조를 변경할 경우, `full_init.sql`에 반영하거나 별도의 차분 마이그레이션 SQL 파일을 생성하여 공유해 주세요.
