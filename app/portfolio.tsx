'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Move3D,
  Pause,
  Play,
  X,
  Maximize2,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  assetPath,
  categories,
  type Project,
  type PortfolioImage,
} from '@/lib/portfolio';
import DreamScene, { type DreamInput } from './dream-scene';
import ReaderOverview from './reader-overview';

const featured = [
  'bi',
  'catchcare',
  'hamo',
  '168705de56b20e',
  '167f8cc3baafea',
  'pizza-ready',
  'siromaro',
  'peko-stationery',
  'illustration',
];
const categoryName = (id: string) =>
  categories.find((c) => c.id === id)?.label || id;
const niceNumber = (n: number) => String(n).padStart(2, '0');
const displayImage = (image: PortfolioImage, motion: boolean) =>
  assetPath(!motion && image.poster ? image.poster : image.src);
function subscribePreferences(callback: () => void) {
  const queries = [
    window.matchMedia('(prefers-reduced-motion: reduce)'),
    window.matchMedia('(pointer: coarse)'),
  ];
  queries.forEach((q) => q.addEventListener('change', callback));
  return () =>
    queries.forEach((q) => q.removeEventListener('change', callback));
}

function ProjectCard({
  project,
  index,
  motion,
}: {
  project: Project;
  index: number;
  motion: boolean;
}) {
  function tilt(event: PointerEvent<HTMLAnchorElement>) {
    if (!motion || event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      '--card-rx',
      `${(-(event.clientY - bounds.top - bounds.height / 2) / bounds.height) * 5}deg`,
    );
    event.currentTarget.style.setProperty(
      '--card-ry',
      `${((event.clientX - bounds.left - bounds.width / 2) / bounds.width) * 6}deg`,
    );
  }
  const style = {
    '--paper-angle': `${[-2, 1.6, -1, 1, -1.8, 2][index % 6]}deg`,
    '--reveal-delay': `${(index % 3) * 80}ms`,
  } as CSSProperties;
  return (
    <a
      className={`project-card ${project.category === 'Digital' ? 'is-paper' : project.category === 'Social' ? 'is-stack' : ''}`}
      href={`#work/${project.id}`}
      aria-label={`${project.title} 펼쳐보기`}
      data-project-id={project.id}
      style={style}
      onPointerMove={tilt}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty('--card-rx', '0deg');
        event.currentTarget.style.setProperty('--card-ry', '0deg');
      }}
    >
      <div className="project-object">
        <div className="project-image">
          <img
            src={assetPath(project.cover.src)}
            width={project.cover.width}
            height={project.cover.height}
            alt={project.title}
            loading="lazy"
            decoding="async"
          />
          <span className="project-open">
            <ArrowUpRight size={21} strokeWidth={1.4} />
            <span>펼쳐보기</span>
          </span>
        </div>
      </div>
      <div className="project-caption">
        <div>
          <p>
            {categoryName(project.category)} <span>· {project.year}</span>
          </p>
          <h3>{project.title}</h3>
        </div>
        <span className="project-number">{niceNumber(index + 1)}</span>
      </div>
    </a>
  );
}

function ProjectReader({
  project,
  all,
  motion,
}: {
  project: Project;
  all: Project[];
  motion: boolean;
}) {
  const body = useRef<HTMLDivElement>(null);
  const map = useRef<HTMLButtonElement>(null);
  const progressBar = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [reading, setReading] = useState(false);
  const isCards =
    project.category === 'Social' &&
    project.images.every((img) => img.height / img.width < 1.7);
  const ratioTotal = project.images.reduce(
    (n, img) => n + img.height / img.width,
    0,
  );
  const sectionEnds = useMemo(() => {
    let ratio = 0;
    const ends: number[] = [];
    for (const img of project.images) {
      ratio += img.height / img.width;
      ends.push(ratio / ratioTotal);
    }
    return ends;
  }, [project, ratioTotal]);
  const related = useMemo(() => {
    const brand = project.title.startsWith('두렙')
      ? '두렙'
      : project.title.includes('하이미니') || project.title === 'HiMiNi'
        ? '하이미니'
        : '';
    return all
      .filter((p) => p.id !== project.id)
      .sort((a, b) => {
        const score = (p: Project) =>
          (p.category === project.category ? 1 : 0) +
          (brand &&
          (p.title.includes(brand) ||
            (brand === '하이미니' && p.title === 'HiMiNi'))
            ? 3
            : 0);
        return score(b) - score(a);
      })
      .slice(0, 3);
  }, [project, all]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!body.current) return;
      const rect = body.current.getBoundingClientRect();
      const p = Math.min(
        1,
        Math.max(0, -rect.top / Math.max(1, rect.height - window.innerHeight)),
      );
      setProgress(Math.round(p * 100));
      if (!isCards) {
        const headerHeight =
          document.querySelector('.site-header')?.getBoundingClientRect()
            .height || 80;
        setReading(
          rect.top < window.innerHeight - 120 &&
            rect.bottom > headerHeight + 120,
        );
        const position = Math.max(
          0,
          (headerHeight + 24 - rect.top) / Math.max(1, rect.height),
        );
        const index = sectionEnds.findIndex((end) => position < end);
        setActiveSection(
          index < 0 ? Math.max(0, project.images.length - 1) : index,
        );
      }
      if (progressBar.current)
        progressBar.current.style.transform = `scaleX(${p})`;
      if (map.current) {
        const fraction = Math.min(1, window.innerHeight / rect.height);
        map.current.style.setProperty(
          '--map-position',
          `${p * (1 - fraction) * 100}%`,
        );
        map.current.style.setProperty('--map-viewport', `${fraction * 100}%`);
      }
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    const resize = new ResizeObserver(request);
    if (body.current) resize.observe(body.current);
    return () => {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      cancelAnimationFrame(frame);
      resize.disconnect();
    };
  }, [project, isCards, sectionEnds]);
  function jumpMap(event: React.MouseEvent<HTMLButtonElement>) {
    if (!body.current) return;
    const r = event.currentTarget.getBoundingClientRect();
    const fraction =
      event.detail === 0
        ? Math.min(1, progress / 100 + 0.2)
        : Math.min(1, Math.max(0, (event.clientY - r.top) / r.height));
    const b = body.current.getBoundingClientRect();
    window.scrollTo({
      top:
        window.scrollY +
        b.top +
        fraction * Math.max(0, b.height - window.innerHeight),
      behavior: motion ? 'smooth' : 'instant',
    });
  }
  const safeEmbeds = project.embeds.filter((url) =>
    /^https:\/\/(www-ccv\.adobe\.io|player\.vimeo\.com|www\.youtube(?:-nocookie)?\.com)\//.test(
      url,
    ),
  );
  return (
    <main className="reader-page" id="main-content">
      <div className="reader-progress" aria-hidden="true">
        <div ref={progressBar} />
      </div>
      <div className="reader-top">
        <a href="#archive" className="back-link">
          <ArrowLeft size={18} /> 아카이브로
        </a>
        <span>
          {categoryName(project.category)} / {project.year}
        </span>
        <a
          href={project.url}
          target="_blank"
          rel="noreferrer"
          className="original-link"
        >
          원본 <ArrowUpRight size={15} />
        </a>
      </div>
      <header className="reader-heading">
        <p className="eyebrow">A LITTLE PIECE OF MY WORLD</p>
        <h1>{project.title}</h1>
        {project.description && (
          <p className="project-description">{project.description}</p>
        )}
        <div className="reader-meta">
          <span>{project.year}</span>
          <span>{categoryName(project.category)}</span>
        </div>
      </header>
      <div className={`reader-layout ${isCards ? 'cards-layout' : ''}`}>
        <div className={isCards ? 'social-gallery' : 'long-paper'} ref={body}>
          {project.images.map((img, index) =>
            isCards ? (
              <button
                type="button"
                className="social-art"
                onClick={() => setLightbox(index)}
                key={img.src}
                aria-label={`${project.title} ${index + 1}번 소재 확대`}
              >
                <img
                  src={displayImage(img, motion)}
                  alt={`${project.title} — ${index + 1}`}
                  width={img.width}
                  height={img.height}
                  loading={index < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                <span>
                  {niceNumber(index + 1)}
                  <Maximize2 size={17} />
                </span>
              </button>
            ) : (
              <img
                className="paper-section"
                tabIndex={-1}
                key={img.src}
                src={displayImage(img, motion)}
                width={img.width}
                height={img.height}
                loading={index < 2 ? 'eager' : 'lazy'}
                decoding="async"
                alt={`${project.title} — 상세 ${index + 1}`}
              />
            ),
          )}
          {!project.images.length && (
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              원본에서 작품 보기 <ArrowUpRight size={16} />
            </a>
          )}
        </div>
        {!isCards && project.images.length > 1 && (
          <aside className="reader-map">
            <button
              ref={map}
              className="mini-paper"
              onClick={jumpMap}
              aria-label="전체 작품 지도. 원하는 위치를 누르면 이동합니다."
            >
              {project.images.map((img) => (
                <img
                  key={img.src}
                  src={assetPath(img.mini || img.src)}
                  alt=""
                  style={{
                    height: `${(img.height / img.width / ratioTotal) * 100}%`,
                  }}
                  loading="lazy"
                />
              ))}
              <span className="map-marker" />
            </button>
            <span className="map-percent">{progress}%</span>
          </aside>
        )}
      </div>
      {!isCards && project.images.length > 1 && (
        <ReaderOverview
          images={project.images}
          title={project.title}
          body={body}
          progress={progress}
          active={activeSection}
          motion={motion}
          reading={reading}
        />
      )}
      {project.text.length > 0 && (
        <div className="project-notes">
          {project.text.map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </div>
      )}
      {safeEmbeds.length > 0 && (
        <div className="project-videos">
          {safeEmbeds.map((url) => (
            <iframe
              key={url}
              src={url}
              title={`${project.title} 영상`}
              allow="fullscreen; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ))}
        </div>
      )}
      <section className="related-work">
        <div className="section-line">
          <span>가까이 놓인 작업들</span>
          <a href="#archive">
            모두 보기 <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="related-grid">
          {related.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} motion={motion} />
          ))}
        </div>
      </section>
      <Dialog
        open={lightbox !== null}
        onOpenChange={(open) => {
          if (!open) setLightbox(null);
        }}
      >
        <DialogContent className="art-lightbox" showCloseButton={false}>
          <DialogTitle className="sr-only">
            {project.title} 소재 확대
          </DialogTitle>
          <DialogDescription className="sr-only">
            이미지를 크게 보고 이전 또는 다음 소재로 이동합니다.
          </DialogDescription>
          <DialogClose className="lightbox-close" aria-label="확대 보기 닫기">
            <X />
          </DialogClose>
          {lightbox !== null && (
            <>
              <img
                src={displayImage(project.images[lightbox], motion)}
                alt={`${project.title} — 소재 ${lightbox + 1}`}
              />
              <div className="lightbox-controls">
                <button
                  aria-label="이전 소재"
                  onClick={() =>
                    setLightbox(
                      (lightbox - 1 + project.images.length) %
                        project.images.length,
                    )
                  }
                >
                  <ArrowLeft />
                </button>
                <span>
                  {niceNumber(lightbox + 1)} /{' '}
                  {niceNumber(project.images.length)}
                </span>
                <button
                  aria-label="다음 소재"
                  onClick={() =>
                    setLightbox((lightbox + 1) % project.images.length)
                  }
                >
                  <ArrowRight />
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function Portfolio({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const [category, setCategory] = useState('All');
  const reducedMotion = useSyncExternalStore(
    subscribePreferences,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => true,
  );
  const [motionOverride, setMotion] = useState<boolean | null>(null);
  const motion = motionOverride ?? !reducedMotion;
  const [selected, setSelected] = useState<Project | null>(null);
  const [tilt, setTilt] = useState(false);
  const tiltAvailable = useSyncExternalStore(
    subscribePreferences,
    () =>
      'DeviceOrientationEvent' in window &&
      window.matchMedia('(pointer: coarse)').matches,
    () => false,
  );
  const [status, setStatus] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const input = useRef<DreamInput>({ x: 0, y: 0 });
  const hero = useRef<HTMLElement>(null);
  const selectedRef = useRef<Project | null>(null);
  const homeScroll = useRef(0);
  const lastProject = useRef('');
  const ordered = useMemo(
    () =>
      [...initialProjects].sort((a, b) => {
        const ai = featured.indexOf(a.id),
          bi = featured.indexOf(b.id);
        return (ai < 0 ? 100 + a.order : ai) - (bi < 0 ? 100 + b.order : bi);
      }),
    [initialProjects],
  );
  const visibleProjects = useMemo(
    () => ordered.filter((p) => category === 'All' || p.category === category),
    [ordered, category],
  );

  useEffect(() => {
    const sync = () => {
      let id = '';
      try {
        id = decodeURIComponent(window.location.hash.replace(/^#work\//, ''));
      } catch {}
      const next = window.location.hash.startsWith('#work/')
        ? initialProjects.find((p) => p.id === id) || null
        : null;
      const prev = selectedRef.current;
      if (next) {
        if (!prev) {
          homeScroll.current = window.scrollY;
          lastProject.current = next.id;
        }
        selectedRef.current = next;
        setSelected(next);
        document.title = `${next.title} — jungeun park`;
        requestAnimationFrame(() =>
          window.scrollTo({ top: 0, behavior: 'instant' }),
        );
      } else {
        selectedRef.current = null;
        setSelected(null);
        document.title = 'jungeun park — Little things, thoughtfully made.';
        requestAnimationFrame(() => {
          if (window.location.hash === '#top') {
            window.scrollTo({ top: 0, behavior: 'instant' });
          } else if (window.location.hash === '#contact') {
            document.getElementById('contact')?.scrollIntoView();
          } else if (prev) {
            window.scrollTo({
              top:
                homeScroll.current ||
                document.getElementById('archive')?.offsetTop ||
                0,
              behavior: 'instant',
            });
            document
              .querySelector<HTMLAnchorElement>(
                `[data-project-id="${lastProject.current}"]`,
              )
              ?.focus({ preventScroll: true });
          } else if (window.location.hash === '#archive')
            document.getElementById('archive')?.scrollIntoView();
        });
      }
    };
    const before = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    sync();
    window.addEventListener('hashchange', sync);
    return () => {
      history.scrollRestoration = before;
      window.removeEventListener('hashchange', sync);
    };
  }, [initialProjects]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 80);
      if (hero.current) {
        const r = hero.current.getBoundingClientRect();
        const p = motion
          ? Math.max(
              0,
              Math.min(
                1,
                -r.top / (hero.current.offsetHeight - window.innerHeight),
              ),
            )
          : 0;
        hero.current.style.setProperty('--journey', String(p));
      }
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    const pointer = (e: globalThis.PointerEvent) => {
      if (motion && !tilt && e.pointerType === 'mouse') {
        input.current = {
          x: (e.clientX / window.innerWidth) * 2 - 1,
          y: 1 - (e.clientY / window.innerHeight) * 2,
        };
      }
    };
    window.addEventListener('pointermove', pointer, { passive: true });
    return () => {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      window.removeEventListener('pointermove', pointer);
      cancelAnimationFrame(frame);
    };
  }, [motion, tilt, selected]);
  useEffect(() => {
    if (!tilt || !motion) return;
    let baseline: { beta: number; gamma: number; angle: number } | null = null;
    const orient = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return;
      const angle = window.screen.orientation?.angle || 0;
      if (baseline === null || baseline.angle !== angle)
        baseline = { beta: event.beta, gamma: event.gamma, angle };
      const horizontal = (event.gamma - baseline.gamma) / 22;
      const vertical = (baseline.beta - event.beta) / 22;
      const radians = (angle * Math.PI) / 180;
      input.current = {
        x: Math.max(
          -1,
          Math.min(
            1,
            horizontal * Math.cos(radians) + vertical * Math.sin(radians),
          ),
        ),
        y: Math.max(
          -1,
          Math.min(
            1,
            vertical * Math.cos(radians) - horizontal * Math.sin(radians),
          ),
        ),
      };
    };
    window.addEventListener('deviceorientation', orient, { passive: true });
    return () => {
      window.removeEventListener('deviceorientation', orient);
      input.current = { x: 0, y: 0 };
    };
  }, [tilt, motion]);
  async function toggleTilt() {
    if (tilt) {
      setTilt(false);
      setStatus('기울기 반응을 껐습니다.');
      return;
    }
    try {
      const api = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<string>;
      };
      if (
        api.requestPermission &&
        (await api.requestPermission()) !== 'granted'
      ) {
        setStatus('센서 권한이 허용되지 않았어요. 스크롤로 둘러볼 수 있어요.');
        return;
      }
      setMotion(true);
      setTilt(true);
      setStatus('휴대폰을 살짝 기울여 보세요.');
    } catch {
      setStatus(
        '이 기기에서는 기울기를 사용할 수 없어요. 스크롤로 둘러볼 수 있어요.',
      );
    }
  }
  return (
    <div
      id="top"
      className={`portfolio ${motion ? 'motion-on' : 'motion-off'} ${selected ? 'in-project' : ''}`}
    >
      <a className="skip-link" href="#main-content">
        콘텐츠로 바로가기
      </a>
      <header
        className={`site-header ${scrolled || selected ? 'on-paper' : ''}`}
      >
        <a
          href="#top"
          className="wordmark"
          aria-label="박정은 포트폴리오 첫 화면"
        >
          jungeun park<span className="wordmark-dot">.</span>
        </a>
        <nav aria-label="주 메뉴">
          <a href="#archive">
            Work <sup>{initialProjects.length}</sup>
          </a>
          <a href="#contact">
            Contact <ArrowUpRight size={14} />
          </a>
        </nav>
        <div className="motion-controls">
          {tiltAvailable && (
            <button
              onClick={toggleTilt}
              aria-pressed={tilt}
              aria-label={tilt ? '기울기 반응 끄기' : '기울기 반응 켜기'}
              title="기울기 반응"
            >
              <Move3D size={18} />
            </button>
          )}
          <button
            onClick={() => {
              setMotion(!motion);
              if (motion) setTilt(false);
            }}
            aria-label={motion ? '움직임 멈추기' : '움직임 재생하기'}
            aria-pressed={!motion}
            title={motion ? '움직임 멈추기' : '움직임 재생하기'}
          >
            {motion ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
      </header>
      {status && (
        <output className="sensor-message">
          {status}
          <button onClick={() => setStatus('')} aria-label="안내 닫기">
            <X size={16} />
          </button>
        </output>
      )}
      {selected ? (
        <ProjectReader
          key={selected.id}
          project={selected}
          all={ordered}
          motion={motion}
        />
      ) : (
        <main id="main-content">
          <section
            className="dream-section"
            ref={hero}
            aria-label="작은 꿈에서 시작하는 디자인"
          >
            <div className="dream-sticky">
              <DreamScene motion={motion} input={input} />
              <div className="hero-content">
                <p className="hero-eyebrow">A LITTLE WORLD OF DESIGN</p>
                <h1>
                  Little things,
                  <br />
                  <span>big dreams.</span>
                </h1>
                <p className="hero-description">
                  아가가 세상을 처음 만나듯,
                  <br />
                  익숙한 것을 새로운 눈으로 바라봅니다.
                </p>
                <a className="hero-cta" href="#archive">
                  나의 작업들 만나보기 <ArrowDown size={18} />
                </a>
              </div>
              <div className="dream-note">
                <span className="tiny-dot" /> dreaming, softly.
              </div>
              <div className="hero-bottom">
                <a href="#archive" className="scroll-invitation">
                  <span>SCROLL TO WANDER</span>
                  <ArrowDown size={17} />
                </a>
                <span>
                  JUNGEUN PARK
                  <br />
                  DESIGN ARCHIVE
                </span>
              </div>
              <div className="sky-transition" aria-hidden="true" />
            </div>
          </section>
          <section
            className="archive-section"
            id="archive"
            aria-labelledby="archive-title"
          >
            <div className="archive-intro">
              <div>
                <p className="eyebrow">THE THINGS I MAKE</p>
                <h2 id="archive-title">
                  작은 것들에,
                  <br />
                  마음을 담아서<span>.</span>
                </h2>
              </div>
              <p>
                색과 형태, 손끝에 닿는 작은 감각까지.
                <br />
                세상을 처음 만나는 호기심으로 관찰하고,
                <br />
                그 발견을 브랜드와 이미지, 경험으로 만듭니다.
              </p>
            </div>
            <Tabs
              value={category}
              onValueChange={(value) => setCategory(String(value))}
              className="archive-tabs"
            >
              <div className="archive-toolbar">
                <TabsList
                  variant="line"
                  className="category-list"
                  aria-label="작품 분야"
                >
                  {categories.map((c) => (
                    <TabsTrigger
                      key={c.id}
                      value={c.id}
                      className="category-tab"
                    >
                      {c.label}
                      {c.id === 'All' && <sup>{initialProjects.length}</sup>}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <span className="archive-year">2017 — 2025</span>
              </div>
              {categories.map((c) => (
                <TabsContent key={c.id} value={c.id} className="archive-panel">
                  <div className="project-grid">
                    {category === c.id &&
                      visibleProjects.map((p, i) => (
                        <ProjectCard
                          project={p}
                          index={i}
                          motion={motion}
                          key={p.id}
                        />
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </section>
        </main>
      )}
      <footer className="site-footer" id="contact">
        <div className="footer-top">
          <div>
            <p className="eyebrow">LET&apos;S MAKE SOMETHING LOVELY</p>
            <h2>
              다음 이야기는,
              <br />
              함께 만들어요.
            </h2>
          </div>
          <a className="contact-link" href="mailto:je_xoxo@naver.com">
            je_xoxo@naver.com <ArrowUpRight size={28} />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} jungeun park</span>
          <a
            href="https://infj.myportfolio.com/"
            target="_blank"
            rel="noreferrer"
          >
            Original archive <ArrowUpRight size={13} />
          </a>
          <a href="#top">
            Back to the clouds <ArrowRight size={14} />
          </a>
        </div>
      </footer>
    </div>
  );
}
