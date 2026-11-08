# 맨 인 블랙 : 수상한 지구 생활

6학년 영어 1~12단원 복습용 협동 수사 게임 (3~4명 팀 · 태블릿/스마트폰)

- 학생: `/`  ·  교사 관리: `/teacher.html` (기본 비밀번호 finel9932!)
- 반 입장 코드: 8반 0608 · 9반 0609 · 10반 0610

## 실행
```
npm install
npm start        # http://localhost:3000
```

## Render 배포
1. 이 저장소를 GitHub에 올립니다.
2. Render → New Web Service → 저장소 연결 (Build: `npm install`, Start: `npm start`)
3. 환경 변수 `TEACHER_PASSWORD`로 교사 비밀번호를 바꿀 수 있습니다.
   무료 요금제는 15분 쉬면 잠들어요. 수업 전에 교사 화면을 미리 열어 두세요.

## 그래픽 교체
임시 그래픽(SVG)은 `public/art.js`에 있습니다. 직접 그린 그림이 준비되면
`public/img/alien-pudding.png` 등 6종을 넣고 `window.MIB_IMG`를 정의하면 교체됩니다.
