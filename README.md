# hakyng-x-bots-monorepo

재미있는 X(트위터) 봇을 개발하고 있습니다.

이 프로젝트는 `pnpm` 워크스페이스를 사용하는 모노레포로 구성되어 있습니다.

- `apps/githyung`: 오늘의 운세 내용을 생성하고 트윗하는 메인 Vercel 서버리스 함수입니다.
- `packages/x-bot-toolkit`: 여러 봇에서 재사용 가능한 유틸리티 및 API 클라이언트 라이브러리입니다.
  - **Groq Client**: Groq (LLM) API와 연동하여 콘텐츠를 생성합니다.
  - **Twitter Client**: Twitter API v2와 연동하여 트윗 스레드를 게시합니다.

## 시작하기

### 사전 준비

- Node.js (v22 권장)

### 설치

프로젝트 루트 디렉토리에서 아래 명령어를 실행하여 모든 의존성을 설치합니다.

```bash
pnpm install
```

### 환경변수 설정

각 앱이 동작하려면 API 키 등의 비밀 정보가 필요합니다. (`apps/githyung`을 예시로 설명하겠습니다.)

1.  `apps/githyung` 디렉토리로 이동합니다.
2.  `.env.sample` 파일을 복사하여 `.env` 파일을 생성합니다.

    ```bash
    cp ./.env.sample ./.env
    ```
3.  생성된 `.env` 파일을 열어 실제 키로 채워넣습니다.

### 빌드

공유 라이브러리인 `x-bot-toolkit`을 사용하기 전에 반드시 빌드해야 합니다. 프로젝트 루트에서 아래 명령어를 실행하세요.

```bash
pnpm --filter "@hakyung/x-bot-toolkit" run build
```

## 로컬 개발

로컬 최초 실행시에는 link가 필요합니다.

```bash
vercel link
```

이후, 아래 명령어를 실행하여 Vercel 개발 서버를 시작합니다.

```bash
vercel dev
```

서버가 시작되면 `http://localhost:3000` 주소로 접속할 수 있습니다.

## 테스트

앱 디렉토리 안에는 테스트용 쉘 스크립트가 포함되어 있습니다.

- **Dry Run (트윗하지 않고 내용만 생성)**

  ```bash
  sh apps/githyung/test_dryrun.sh
  ```

- **실제 트윗 발행**

  ```bash
  sh apps/githyung/test_tweet.sh
  ```

## 배포

이 프로젝트는 Vercel에 배포됩니다. 각 app 디렉토리 내부의 `vercel.json` 파일에 정의된 cron 스케줄에 따라 매일 지정된 시간에 자동으로 운세를 생성하고 트윗합니다.
