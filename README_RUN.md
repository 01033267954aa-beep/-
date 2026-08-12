# Meow Cafe Tycoon 실행 및 배포

## 시작 파일

`index.html`이 게임 시작 파일입니다.

`index.html`, `style.css`, `script.js`, `assets/`가 프로젝트 루트에 있어야 합니다.

## 공개 URL로 플레이

Render 배포가 끝나면 Render 대시보드에서 생성된 `https://...onrender.com` 주소를 Chrome, Safari, Edge 주소창에 입력해서 플레이합니다.

아직 Render에서 배포가 완료되지 않았다면 공개 URL은 존재하지 않습니다.

## VS Code Live Server로 실행

1. VS Code 확장 탭을 엽니다.
2. `Live Server` 확장을 설치합니다.
3. 파일 탐색기에서 `index.html`을 엽니다.
4. 오른쪽 아래 `Go Live` 버튼을 누릅니다.
5. 브라우저에서 `http://127.0.0.1:5500` 또는 `http://localhost:5500`으로 접속합니다.

## Live Server 없이 실행

VS Code 터미널에서 다음 명령을 실행합니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\dev-server.ps1 -Port 5500
```

브라우저에서 아래 주소를 엽니다.

```text
http://127.0.0.1:5500
```

서버를 종료하려면 터미널에서 `Ctrl+C`를 누릅니다.

## Render 배포 설정

Render에서 Static Site를 선택하고 다음 값을 사용합니다.

```text
Build Command: echo "No build step required for static HTML/CSS/JS"
Publish Directory: .
```

Blueprint를 사용하는 경우 `render.yaml`의 `staticPublishPath: ./`가 프로젝트 루트의 `index.html`을 배포 대상으로 지정합니다.

## GitHub에 포함할 파일

다음 파일과 폴더는 저장소에 포함합니다.

```text
index.html
style.css
script.js
assets/
render.yaml
README_RUN.md
dev-server.ps1
.gitignore
```

`.meow-cafe-server.pid`, `.env`, 로그 파일, `node_modules/`는 포함하지 않습니다.

## Render 배포 순서

1. GitHub에서 새 저장소를 만듭니다.
2. 현재 프로젝트 파일을 GitHub 저장소에 업로드합니다.
3. Render에 로그인합니다.
4. `New` 버튼을 누릅니다.
5. `Static Site`를 선택합니다.
6. GitHub 계정을 연결합니다.
7. Meow Cafe Tycoon 저장소를 선택합니다.
8. 배포할 branch를 선택합니다.
9. Build Command에 `echo "No build step required for static HTML/CSS/JS"`를 입력합니다.
10. Publish Directory에 `.`를 입력합니다.
11. `Create Static Site` 또는 `Deploy`를 누릅니다.
12. 배포가 끝나면 Render 서비스 화면의 `onrender.com` URL을 확인합니다.
