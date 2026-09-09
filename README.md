# jungeun park — design archive

자연스러운 야생화 꽃밭에서 시작하는 박정은의 인터랙티브 디자인 포트폴리오입니다. 서로 다른 작업이 가진 색과 형태를 꽃밭의 다양성과 연결했습니다.

사이트: https://notoow.github.io/jungeun_portfolio/

## 구성

- 원본 Adobe Portfolio의 61개 프로젝트를 로컬 이미지로 이전했습니다.
- 가로·세로 화면에 맞춘 꽃밭 이미지 두 장을 사용합니다. 사진의 전경에 한정한 미세한 바람 변형과 포인터·기울기 반응, 스크롤 확대를 Three.js 셰이더로 구현했습니다. 개별 꽃을 가진 3D 모델이나 식물 물리 시뮬레이션은 아닙니다.
- 배경 제거와 색상 키잉 없이 완전한 장면을 사용합니다. WebGL이 없거나 이미지 로딩에 실패하면 일반 이미지가 유지됩니다.
- 기울기 시작 시 현재 자세를 기준으로 잡고 가로·세로 방향 전환 시 기준을 다시 잡습니다. 고밀도 화면에서도 최대 렌더 픽셀 수를 제한합니다.
- 작품 목록은 넓은 화면에서 크기와 높낮이가 다른 세 열, 태블릿에서 두 열, 작은 모바일에서 한 열로 배치합니다. 분야 필터는 스크롤 중에도 접근할 수 있습니다.
- 스크롤·마우스·지원 모바일 기기의 기울기에 반응하며, 움직임을 끄거나 운영체제의 동작 줄이기 설정을 따를 수 있습니다.
- 긴 상세페이지는 기본 문서 스크롤로 읽습니다. 작은 전체 지도, 원래 탐색 위치 복귀, 연관 작업 이동을 제공합니다.
- 상세페이지 하단의 ‘전체 흐름’으로 모든 구간을 한눈에 보고 이동할 수 있습니다. 이전·다음 구간 버튼과 현재 읽는 위치도 제공하며, 모바일에서는 전체 흐름이 하단 시트로 열립니다.
- 꽃밭 장면은 화면 밖이나 숨겨진 탭에서 프레임 예약을 멈추며, 정지 상태에서는 크기·스크롤 변경에 필요한 한 프레임만 그립니다.
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

꽃밭 이미지는 built-in image_gen으로 생성했습니다. 최종 자산은 `public/meadow/landscape.webp`와 `public/meadow/portrait.webp`이며, 원본 해상도를 유지한 WebP quality 94입니다. 디자인 방향과 전체 프롬프트는 `docs/meadow-design.md`에 기록했습니다. 포트폴리오 작품과 생성 히어로는 별개입니다. 이전 OG 공유 카드는 유지했습니다.

정적 빌드 검증은 61개 프로젝트의 누락, 미디어 경로, 글꼴, 히어로 자산과 생성된 JS/CSS 경로를 확인합니다. 모바일 센서의 권한·감도는 실제 기기에서도 확인하는 것이 좋습니다.

애니메이션 스케줄러 테스트는 화면 밖 정지, 한 프레임 갱신, 복귀 시 시간 연속성, 페이지 전환 시 정리를 검증하며 배포 전 자동 실행됩니다.

## 저장한 아가 버전

- Git 태그: `sleeping-baby-v1-20260909` (GitHub에도 저장).
- 원본 커밋: `fc5424ff44acf05108bbbfd21946657c9ee8418a`.
- 로컬 소스 백업: `outputs/versions/sleeping-baby-v1-source.zip`.
- 원본 PNG 묶음: `outputs/hero-source-originals.zip`.

태그에서 새 작업 트리를 만들면 현재 꽃밭 작업을 건드리지 않고 이전 버전을 열 수 있습니다. 로컬 `outputs/` 파일은 Git과 공개 배포에 포함하지 않습니다. 이전 생성 자산과 프롬프트도 기록으로 보관합니다.
