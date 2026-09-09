# jungeun park — design archive

파란 하늘, 구름, 잠든 아기에서 시작하는 박정은의 인터랙티브 디자인 포트폴리오입니다.

사이트: https://notoow.github.io/jungeun_portfolio/

## 구성

- 원본 Adobe Portfolio의 61개 프로젝트를 로컬 이미지로 이전했습니다.
- 아가, 뒤쪽 담요, 앞쪽 담요를 개별 이미지와 곡면으로 분리하고, 서로 다른 깊이의 구름 6개와 Three.js 원근 카메라를 결합했습니다. 아기 자체는 관절을 가진 3D 모델이 아닌 이미지 레이어입니다.
- 구름은 마우스·휴대폰 기울기에 따라 세 축으로 회전하며, 가까운 구름일수록 크게 반응합니다. 스크롤에 따라 카메라가 다가가고 앞 구름이 올라옵니다.
- 기울기 시작 시 양 축의 현재 자세를 기준으로 잡으며 가로·세로 방향 전환 시 다시 기준을 잡습니다. 고밀도 화면에서 렌더 해상도를 높이되 총 픽셀 수를 제한합니다.
- 스크롤·마우스·지원 모바일 기기의 기울기에 반응하며, 움직임을 끄거나 운영체제의 동작 줄이기 설정을 따를 수 있습니다.
- 긴 상세페이지는 기본 문서 스크롤로 읽습니다. 작은 전체 지도, 원래 탐색 위치 복귀, 연관 작업 이동을 제공합니다.
- 상세페이지 하단의 ‘전체 흐름’으로 모든 구간을 한눈에 보고 이동할 수 있습니다. 이전·다음 구간 버튼과 현재 읽는 위치도 제공하며, 모바일에서는 전체 흐름이 하단 시트로 열립니다.
- 아기 장면은 화면 밖이나 숨겨진 탭에서 프레임 예약을 멈추며, 정지 상태에서는 크기·스크롤 변경에 필요한 한 프레임만 그립니다.
- 독립된 소셜 광고는 카드 그리드와 확대 보기로 볼 수 있습니다.
- 원본 애니메이션 38개를 움직이는 WebP로 변환했습니다. 정지 포스터도 함께 보관합니다.
- Pretendard Variable을 직접 호스팅합니다. 글꼴 라이선스는 `public/fonts/OFL.txt`입니다.

## 개발

Node.js 22.13 이상을 사용합니다.

```sh
npm ci
npm run dev
```

미리보기: `http://localhost:3000/jungeun_portfolio/`

```sh
npm run lint -- app lib main.tsx
npm test
npm run build
```

React + Vite 정적 빌드이며 서버나 데이터베이스가 필요하지 않습니다. 결과물은 `dist/`에 생성되고 GitHub Actions가 Pages에 배포합니다. 주소의 하위 경로는 `vite.config.ts`, `lib/portfolio.ts`, `app/globals.css`에 설정되어 있습니다. 작품 주소는 `#work/프로젝트ID` 형식이므로 Pages에서 새로고침해도 경로 404가 발생하지 않습니다.

## 작품 수정

`public/data/projects.json`의 제목·연도·설명·분야·이미지 순서를 수정하고 `public/media/`에 이미지를 추가하세요. 원본에서 제공되지 않은 역할이나 성과는 임의로 작성하지 않았습니다. 일부 분야 분류는 탐색을 위한 편집입니다.

원본을 다시 가져오려면 Python에 `requests`, `beautifulsoup4`, `Pillow`를 설치하고 순서대로 실행합니다.

```sh
python scripts/import-portfolio.py
python scripts/finalize-assets.py
python scripts/optimize-animations.py
python scripts/clean-unused-media.py
```

원본 다운로드 캐시는 `.import-cache/`에 보관하며 Git에 포함하지 않습니다. 긴 이미지는 2400px 높이 단위로 나누어 지연 로딩합니다. 원본 영상 2개는 Adobe 플레이어에 연결됩니다.

## 아트 자산 및 검증

히어로의 아기와 구름은 built-in image_gen으로 생성했습니다. 최종 자산은 `public/hero/sleeping-baby.webp`, `public/hero/cloud.webp`이고 전체 생성 프롬프트는 `docs/image-prompts.md`에 기록했습니다. 포트폴리오 작품과 생성 히어로는 별개입니다.

정적 빌드 검증은 61개 프로젝트의 누락, 미디어 경로, 글꼴, 히어로 자산과 생성된 JS/CSS 경로를 확인합니다. 모바일 센서의 권한·감도는 실제 기기에서도 확인하는 것이 좋습니다.

애니메이션 스케줄러 테스트는 화면 밖 정지, 한 프레임 갱신, 복귀 시 시간 연속성, 페이지 전환 시 정리를 검증하며 배포 전 자동 실행됩니다.
