# Daily Lab

작은 코드·기능 하나 + 짧은 제작 기록 + GitHub 커밋. 매일의 입력을 결과물로 바꾸는 개인 제작실입니다.

## 실행

Node.js 22 이상이 필요합니다. 외부 패키지 설치는 필요 없습니다.

    npm run dev

http://localhost:4173 에서 확인합니다. Markdown을 수정한 뒤 새로고침하면 반영됩니다.

    npm test
    npm run build

배포 결과는 dist/에 생성됩니다. 이 폴더는 자동 생성되므로 직접 편집하거나 커밋하지 않습니다.

## 매일 기록하기

    npm run new -- file-hash

한국 시간 기준 오늘 날짜로 content/daily/YYYY-MM-DD-file-hash.md 초안을 만듭니다. 같은 이름은 덮어쓰지 않습니다.

1. title, summary, tags와 본문을 작성합니다.
2. 관련 도구가 있으면 tool: daily-lab처럼 파일 이름에서 .md를 제외한 값을 추가합니다.
3. 완성한 기록은 draft: false로 바꿉니다.
4. npm test와 npm run build로 확인합니다.
5. git add, git commit, git push로 main에 올립니다.

GitHub 웹에서 content/daily에 Add file → Create new file로 Markdown을 추가해도 됩니다. 설정을 완료한 저장소의 main에 push하거나 웹에서 커밋하면 Actions가 빌드·배포합니다. 로컬에서 commit만 하고 push하지 않으면 GitHub에는 반영되지 않습니다.

## 기록 메타데이터

title, date, summary는 필수입니다. tags는 [SQL, Web] 형식입니다. draft는 true 또는 false를 사용합니다. 날짜는 YYYY-MM-DD입니다. 첫 줄과 메타데이터 끝에 ---를 넣으세요. 복잡한 YAML 문법은 지원하지 않습니다. 한 줄 문자열을 사용하고 따옴표가 필요하면 전체 값을 감싸세요.

commit: https://github.com/owner/repo/commit/SHA 를 추가하면 특정 기능의 커밋에 연결할 수 있습니다. 생략하면 배포 시 해당 Markdown 파일의 최근 커밋을 자동 연결합니다. 사이트 저장소는 Actions의 GITHUB_REPOSITORY에서 자동 감지합니다.

## 도구 추가하기

content/tools/daily-lab.md를 복사하고 영문 소문자·숫자·하이픈 파일 이름을 붙입니다.

필수: title, summary, status

선택: tags, repo, demo, draft, sample

status: building / active / paused / archived

sample: true인 도구는 예시로 표시되며 홈과 실제 도구 개수에서 제외됩니다. hash-check-example.md는 작성 형식을 보여주는 예시입니다. 필요 없으면 삭제하세요.

## 표시 이름과 소개

site.config.json의 name, title, description, intro를 편집합니다. repository는 비워 두면 GitHub Actions가 자동 감지합니다. 로컬에서도 저장소 링크를 보고 싶으면 실제 https://github.com/owner/repository 값을 넣습니다.

## GitHub Pages 최초 연결

1. 본인 GitHub에 비어 있는 저장소를 만들고 이 프로젝트를 main 브랜치로 push합니다.
2. 저장소 Settings → Pages → Build and deployment → Source를 GitHub Actions로 선택합니다.
3. Actions → Publish Daily Lab → Run workflow를 누르거나 main에 새 커밋을 push합니다.
4. 초록색 Deploy 작업에 표시된 주소를 엽니다.

    git remote add origin https://github.com/OWNER/REPOSITORY.git
    git push -u origin main

저장소 이름이 OWNER.github.io라면 루트, 일반 저장소라면 /REPOSITORY/ 아래로 자동 빌드합니다. 실패하면 Actions 로그에 표시된 메타데이터·날짜·링크 오류를 수정하세요. GitHub 인증이 만료되었다면 gh auth login으로 먼저 로그인합니다.

## 지원 Markdown

제목, 문단, 굵은 글씨, 인라인 코드, fenced code block, 단순 목록, 인용문, 수평선, http/https 링크를 지원합니다. HTML·이미지·중첩 목록·표·MDX는 지원하지 않습니다. 원문 HTML은 실행하지 않고 텍스트로 표시합니다.

## 공개 전 확인

초안은 배포 산출물에서 제외되지만 공개 GitHub 저장소에 커밋한 파일은 그대로 공개됩니다. 비밀키나 개인 자료는 저장소에 넣지 마세요. 소스는 MIT 라이선스로 재사용할 수 있습니다. 자세한 조건은 LICENSE를 확인하세요.

사이트는 정적 HTML이므로 데이터베이스나 로그인 서버가 필요 없습니다. 웹 폰트는 Google Fonts를 사용하며 접속이 안 되면 시스템 글꼴로 표시됩니다.
