# building-doctor-server

## 역할

- API 서버
- Worker 배치 앱
- 공통 라이브러리
- 향후 DB migration / Docker 구성 관리

## 현재 단계

- NestJS monorepo 초기 세팅
- API health check
- Worker 실행 확인
- ESLint / Prettier / TypeScript 기본 검증 세팅

## 실행

```bash
pnpm install
pnpm start:dev:api
pnpm start:worker
pnpm build
pnpm typecheck
pnpm lint
pnpm format:check
```

## 아직 하지 않은 것

- DB 스키마
- Docker DB 구성
- 국토부 API 연동
- 지오코딩
- 실거래 데이터 수집
