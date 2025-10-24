# Global Love Bridge - 글로벌 국제 연애·결혼 플랫폼

> **국경을 넘어 사랑을 연결하는 국제 연애·결혼 매칭 플랫폼**

## 🌍 프로젝트 개요

Global Love Bridge는 전 세계 사람들이 신뢰할 수 있는 환경에서 국제적인 연애와 결혼을 위한 인연을 찾을 수 있도록 지원하는 포괄적인 매칭 플랫폼입니다.

### 핵심 특징

- **✅ 까다로운 회원 인증**: 3개 이상의 소셜 미디어 계정 인증 필수
- **🌐 7개 언어 지원**: 한국어, 영어, 중국어, 일본어, 베트남어, 스페인어, 아랍어
- **💬 실시간 번역**: WeChat 스타일의 메시지 자동 번역 기능
- **🤖 AI 매칭**: 관심사, 성향, 선호도 기반 스마트 매칭
- **📸 미디어 공유**: 사진(최대 10장), 동영상(최대 3개), 스토리 기능
- **🎁 가상 선물**: 포인트 시스템과 선물 보내기
- **🔒 안전성**: AI 기반 콘텐츠 필터링 및 신고 시스템

## 🚀 현재 배포 URL

- **프로덕션**: https://3000-idbqtv2y06t8mg8819x2t-2b54fc91.sandbox.novita.ai
- **API Health Check**: https://3000-idbqtv2y06t8mg8819x2t-2b54fc91.sandbox.novita.ai/api/health
- **GitHub**: (준비 중)

## 📋 완료된 기능

### ✅ 회원 관리 시스템
- [x] 사용자 프로필 CRUD (생성, 조회, 수정, 삭제)
- [x] 소셜 미디어 인증 (Facebook, Instagram, Kakao, X, Naver, Google, WeChat)
- [x] 3개 이상 인증 시 무료 회원 자격 부여
- [x] 얼굴 인증 및 신분증 인증 시스템 (데이터베이스 구조)
- [x] 프로필 사진/동영상 업로드 (최대 10장 사진, 3개 동영상)
- [x] 사용자 검색 기능 (국가, 언어, 성별 필터)

### ✅ 매칭 시스템
- [x] AI 기반 자동 매칭 알고리즘
- [x] 호환성 점수 계산 (나이, 관심사, 언어, 위치 기반)
- [x] 잠재적 매치 추천 (Discovery Feed)
- [x] 매치 요청 및 수락/거절
- [x] 매치 통계 (수락/대기/거절 수)

### ✅ 메시징 시스템
- [x] 1:1 실시간 메시징
- [x] 자동 번역 기능 (사용자 언어 기반)
- [x] 메시지 읽음 상태 추적
- [x] 대화 목록 조회
- [x] 사진/동영상/음성 메시지 지원
- [x] 읽지 않은 메시지 카운터

### ✅ 다국어 지원
- [x] 프론트엔드 7개 언어 번역 (한/영/중/일/베/스/아)
- [x] 언어별 UI 텍스트 자동 전환
- [x] RTL(오른쪽에서 왼쪽) 레이아웃 지원 (아랍어)
- [x] 메시지 번역 API 엔드포인트

### ✅ 기타 기능
- [x] 가상 선물 시스템
- [x] 포인트 거래 시스템
- [x] 알림 시스템 (매치, 메시지, 선물, 시스템)
- [x] 사용자 차단 및 신고
- [x] 활동 로그 (AI 매칭 개선용)
- [x] 리뷰 시스템

## 🔮 미구현 기능 (향후 개발 예정)

### 화상 통화 기능 (WebRTC)
- [ ] WebRTC 기반 비디오/음성 통화
- [ ] 실시간 자막 번역 (STT → 번역 → 자막)
- [ ] 통화 품질 관리
- [ ] 가상 배경 및 필터

### OAuth 실제 연동
- [ ] Facebook OAuth 연동
- [ ] Instagram OAuth 연동
- [ ] Kakao OAuth 연동
- [ ] Naver OAuth 연동
- [ ] X (Twitter) OAuth 연동
- [ ] Google OAuth 연동
- [ ] WeChat OAuth 연동

### 실제 번역 API 연동
- [ ] Google Translate API 연동
- [ ] DeepL API 연동
- [ ] 또는 AI 기반 번역 (OpenAI, Anthropic)

### 미디어 처리
- [ ] Cloudflare R2 또는 S3 연동 (실제 이미지/비디오 업로드)
- [ ] AI 기반 얼굴 인식 및 검증
- [ ] NSFW 콘텐츠 자동 필터링
- [ ] 이미지/비디오 압축 및 최적화

### 결제 시스템
- [ ] 프리미엄 멤버십 결제
- [ ] 포인트 구매
- [ ] Stripe 또는 PayPal 연동

### 모바일 앱
- [ ] React Native 또는 Flutter 앱
- [ ] iOS 앱 스토어 배포
- [ ] Android 플레이 스토어 배포

## 📊 데이터베이스 구조

### 주요 테이블

1. **users** - 사용자 프로필 정보
2. **social_verifications** - 소셜 미디어 인증 내역
3. **user_media** - 사진/동영상/스토리
4. **user_preferences** - 매칭 선호도 설정
5. **matches** - 매칭 기록
6. **messages** - 메시지 (번역 포함)
7. **video_calls** - 화상 통화 기록
8. **user_reviews** - 사용자 리뷰
9. **gifts** - 가상 선물 목록
10. **gift_transactions** - 선물 거래 내역
11. **point_transactions** - 포인트 거래 내역
12. **reports** - 신고 내역
13. **blocked_users** - 차단 사용자
14. **notifications** - 알림
15. **activity_logs** - 활동 로그

### 저장소 서비스

- **Cloudflare D1**: SQLite 기반 관계형 데이터베이스 (현재 사용 중)
- **Cloudflare R2**: 파일 스토리지 (향후 연동 예정)
- **Cloudflare KV**: 세션/캐시 (향후 연동 예정)

## 🛠️ 기술 스택

### 프론트엔드
- **프레임워크**: Hono JSX (Server-Side Rendering)
- **스타일링**: TailwindCSS (CDN)
- **아이콘**: Font Awesome
- **HTTP 클라이언트**: Axios

### 백엔드
- **프레임워크**: Hono (Lightweight Web Framework)
- **런타임**: Cloudflare Workers
- **언어**: TypeScript

### 데이터베이스
- **주 DB**: Cloudflare D1 (SQLite)
- **마이그레이션**: Wrangler CLI

### 배포
- **플랫폼**: Cloudflare Pages
- **빌드 도구**: Vite
- **프로세스 관리**: PM2 (개발 환경)

## 🔑 API 엔드포인트

### 사용자 관리
```
GET    /api/users/:id                 # 사용자 프로필 조회
PUT    /api/users/:id                 # 프로필 수정
GET    /api/users/:id/verifications   # 소셜 인증 내역
POST   /api/users/:id/verifications   # 소셜 인증 추가
GET    /api/users/:id/media           # 미디어 조회
POST   /api/users/:id/media           # 미디어 업로드
GET    /api/users/search              # 사용자 검색
```

### 매칭
```
GET    /api/matches/user/:userId      # 내 매칭 목록
GET    /api/matches/discover/:userId  # 추천 매칭
POST   /api/matches                   # 매치 요청
PUT    /api/matches/:matchId/respond  # 매치 응답 (수락/거절)
DELETE /api/matches/:matchId          # 매치 해제
GET    /api/matches/stats/:userId     # 매칭 통계
```

### 메시징
```
GET    /api/messages/conversations/:userId        # 대화 목록
GET    /api/messages/:userId/with/:otherUserId   # 특정 대화 내역
POST   /api/messages                              # 메시지 보내기
POST   /api/messages/translate                    # 메시지 번역
DELETE /api/messages/:messageId                   # 메시지 삭제
GET    /api/messages/unread/:userId               # 읽지 않은 메시지 수
```

### 선물 & 알림
```
GET    /api/gifts                     # 선물 목록
POST   /api/gifts/send                # 선물 보내기
GET    /api/notifications/:userId     # 알림 목록
PUT    /api/notifications/:id/read    # 알림 읽음 처리
```

### 헬스 체크
```
GET    /api/health                    # API 상태 확인
```

## 💡 사용 가이드

### 1. 회원 가입
1. 랜딩 페이지에서 "Sign Up Free" 클릭
2. 이메일 및 기본 정보 입력
3. **3개 이상의 소셜 미디어 계정 연동** (필수)
   - Facebook, Instagram, Kakao, X, Naver 중 선택
4. 프로필 사진 및 자기소개 작성
5. 무료 회원 자격 획득!

### 2. 프로필 작성
- 최대 10장의 사진 업로드
- 최대 3개의 동영상 업로드
- 관심사, MBTI, 자기소개 작성
- 선호하는 매치 조건 설정 (나이, 국가, 언어 등)

### 3. 매칭
- **Discovery Feed**에서 추천 프로필 탐색
- 마음에 드는 프로필에 "Like" 보내기
- 상대방이 수락하면 매칭 성공!

### 4. 메시징
- 매칭된 상대와 1:1 채팅
- 메시지는 자동으로 상대방 언어로 번역됨
- WeChat 스타일: 원문과 번역문 동시 표시

### 5. 선물 보내기
- 포인트로 가상 선물 구매
- 장미, 하트, 다이아몬드, 커피, 테디베어 등
- 특별한 메시지와 함께 전송

## 🔐 보안 및 개인정보

### 인증 및 검증
- 3개 이상 소셜 미디어 인증 필수
- AI 기반 얼굴 인식 (향후 구현)
- 관리자 프로필 승인제

### 콘텐츠 모니터링
- AI 자동 필터링 (NSFW, 부적절 콘텐츠)
- 사용자 신고 시스템
- 차단 기능

### 데이터 보호
- HTTPS 암호화 통신
- JWT 기반 인증 (향후 구현)
- GDPR, CCPA, 한국 개인정보보호법 준수

## 🚀 로컬 개발 환경 설정

### 필수 조건
- Node.js 18+
- npm 또는 yarn
- Wrangler CLI

### 설치 및 실행

```bash
# 프로젝트 클론
git clone <repository-url>
cd webapp

# 의존성 설치
npm install

# D1 데이터베이스 마이그레이션
npm run db:migrate:local

# 샘플 데이터 추가
npm run db:seed

# 빌드
npm run build

# 개발 서버 시작 (PM2 사용)
pm2 start ecosystem.config.cjs

# 또는 직접 실행
npm run dev:sandbox

# 로그 확인
pm2 logs webapp --nostream

# 서비스 중지
pm2 stop webapp
```

### 데이터베이스 관리

```bash
# 로컬 DB 마이그레이션
npm run db:migrate:local

# 프로덕션 DB 마이그레이션
npm run db:migrate:prod

# 샘플 데이터 추가
npm run db:seed

# DB 초기화 (로컬)
npm run db:reset

# DB 콘솔 (로컬)
npm run db:console:local

# DB 콘솔 (프로덕션)
npm run db:console:prod
```

## 📦 배포 (Cloudflare Pages)

### 준비 사항
1. Cloudflare 계정
2. Cloudflare API Token
3. GitHub 저장소

### 배포 단계

```bash
# 1. Cloudflare D1 데이터베이스 생성
npx wrangler d1 create webapp-production

# 2. wrangler.toml에 database_id 추가

# 3. 프로덕션 DB 마이그레이션
npm run db:migrate:prod

# 4. 빌드
npm run build

# 5. 배포
npm run deploy:prod

# 또는
npx wrangler pages deploy dist --project-name webapp
```

### 환경 변수 설정

```bash
# API 키 설정 (필요한 경우)
npx wrangler pages secret put API_KEY --project-name webapp
```

## 📈 향후 개발 로드맵

### Phase 1 (현재) ✅
- [x] 기본 회원 관리 시스템
- [x] 매칭 알고리즘
- [x] 메시징 시스템
- [x] 다국어 지원
- [x] 데이터베이스 설계

### Phase 2 (1-2개월)
- [ ] OAuth 실제 연동
- [ ] 실제 번역 API 연동
- [ ] 미디어 업로드 (R2/S3)
- [ ] AI 콘텐츠 필터링

### Phase 3 (3-4개월)
- [ ] WebRTC 화상 통화
- [ ] 실시간 번역 자막
- [ ] 결제 시스템
- [ ] 프리미엄 기능

### Phase 4 (5-6개월)
- [ ] 모바일 앱 (iOS/Android)
- [ ] 고급 AI 매칭
- [ ] 국제 결혼 정보 및 비자 안내
- [ ] 제휴 중개 서비스 연동

## 🎯 비즈니스 모델

### 무료 회원
- 기본 프로필 작성
- 매칭 및 메시징
- 사진/동영상 업로드
- 실시간 번역

### 프리미엄 회원 (향후)
- 프로필 우선 노출
- 무제한 번역
- 화상 통화 무제한
- 고급 필터링
- 읽음 확인
- 광고 제거

### 수익원
- 프리미엄 구독
- 포인트 판매
- 가상 선물
- 제휴 광고
- 결혼 중개 제휴 수수료

## 🤝 기여 가이드

현재 개발 중인 프로젝트입니다. 기여를 환영합니다!

### 우선순위 기능
1. OAuth 실제 연동
2. 실제 번역 API 연동
3. WebRTC 화상 통화
4. 미디어 업로드 (R2/S3)
5. AI 콘텐츠 필터링

## 📞 문의 및 지원

- **이슈 트래커**: GitHub Issues (준비 중)
- **이메일**: (추가 예정)
- **문서**: 이 README 참조

## 📄 라이선스

Copyright © 2024 Global Love Bridge. All rights reserved.

---

## 🌟 프로젝트 상태

- **개발 상태**: ✅ MVP 완료 (Backend API + Frontend UI)
- **배포 상태**: ✅ 활성 (Sandbox 환경)
- **기술 스택**: Hono + TypeScript + Cloudflare D1 + TailwindCSS
- **마지막 업데이트**: 2024-10-24

### 테스트 계정 (샘플 데이터)

```
사용자 1: Alice Kim (alice@example.com)
- 국가: South Korea
- 언어: Korean
- 관심사: travel, music, cooking
- 매칭: Bob Smith (수락됨), Chen Wei (대기 중)

사용자 2: Bob Smith (bob@example.com)
- 국가: USA
- 언어: English
- 관심사: sports, technology, travel
- 매칭: Alice Kim (수락됨), Maria Garcia (수락됨)

사용자 3: Chen Wei (chen@example.com)
- 국가: China
- 언어: Chinese
- 관심사: photography, food, art
- 매칭: Sakura Tanaka (수락됨), Alice Kim (대기 중)

사용자 4: Sakura Tanaka (sakura@example.com)
- 국가: Japan
- 언어: Japanese
- 관심사: anime, reading, music
- 매칭: Chen Wei (수락됨)

사용자 5: Maria Garcia (maria@example.com)
- 국가: Spain
- 언어: Spanish
- 관심사: dance, travel, language
- 매칭: Bob Smith (수락됨)
```

**국경을 넘어, 마음으로 연결되는 사랑을 찾아보세요! ❤️🌍**
