# building-doctor-server

## 역할

- API 서버
- Worker 배치 앱
- 공통 라이브러리
- `building_doctor` DB 접속 코드
- migration 파일 관리

## 현재 단계

- NestJS monorepo 초기 세팅
- API health check
- Worker 실행 확인
- ESLint / Prettier / TypeScript 기본 검증 세팅

## 인프라 역할 분리

현재 PostgreSQL/PostGIS 인프라는 별도 `homelab-infra` 프로젝트에서 운영한다.

- 이 레포는 API/Worker 애플리케이션 코드, DB 접속 코드, migration 파일을 관리한다.
- DB 컨테이너, role, extension, 백업/복구 정책은 `homelab-infra`에서 관리한다.
- 로컬 Docker DB 구성과 백업 디렉터리는 이 레포 범위에 포함하지 않는다.

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
- DB 연결 구현
- 국토부 API 연동
- 지오코딩
- 실거래 데이터 수집
