import { useRef, useState, type RefObject } from 'react';
import { ArrowDown, ArrowUp, Grid2X2, X } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { assetPath, type PortfolioImage } from '@/lib/portfolio';

export default function ReaderOverview({
  images,
  title,
  body,
  progress,
  active,
  motion,
  reading,
}: {
  images: PortfolioImage[];
  title: string;
  body: RefObject<HTMLDivElement | null>;
  progress: number;
  active: number;
  motion: boolean;
  reading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pendingJump = useRef<number | null>(null);
  const jumpTarget = useRef<HTMLImageElement | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const activePreview = useRef<HTMLButtonElement>(null);

  function section(index: number) {
    return body.current?.querySelectorAll<HTMLImageElement>('.paper-section')[
      index
    ];
  }
  function jump(index: number) {
    const image = section(index);
    if (!image) return;
    const headerHeight =
      document.querySelector('.site-header')?.getBoundingClientRect().height ||
      80;
    const top =
      image.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
    image.focus({ preventScroll: true });
    window.scrollTo({ top, behavior: motion ? 'smooth' : 'instant' });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (value) jumpTarget.current = null;
        setOpen(value);
      }}
      onOpenChangeComplete={(isOpen) => {
        if (isOpen || pendingJump.current === null) return;
        // Wait for the dialog's scroll lock to release before moving the document.
        jump(pendingJump.current);
        pendingJump.current = null;
      }}
    >
      <div
        className="reading-dock"
        aria-label="작품 읽기 도구"
        hidden={!reading}
      >
        <div className="reading-location">
          <span>
            {String(active + 1).padStart(2, '0')}{' '}
            <span>/ {String(images.length).padStart(2, '0')}</span>
          </span>
          <progress
            value={progress}
            max={100}
            aria-label={`작품 ${progress}% 읽음`}
          />
        </div>
        <DialogTrigger ref={trigger} className="overview-trigger">
          <Grid2X2 size={16} /> 전체 흐름
        </DialogTrigger>
        <div className="reading-arrows">
          <button
            onClick={() => jump(active - 1)}
            disabled={active === 0}
            aria-label="이전 부분으로 이동"
          >
            <ArrowUp size={17} />
          </button>
          <button
            onClick={() => jump(active + 1)}
            disabled={active === images.length - 1}
            aria-label="다음 부분으로 이동"
          >
            <ArrowDown size={17} />
          </button>
        </div>
      </div>
      <DialogContent
        className={`reader-overview ${motion ? '' : 'is-still'}`}
        showCloseButton={false}
        initialFocus={activePreview}
        finalFocus={() => jumpTarget.current || trigger.current}
      >
        <div className="overview-heading">
          <div>
            <DialogTitle>한눈에 펼쳐보기</DialogTitle>
            <DialogDescription>
              {title} · 원하는 장면을 누르면 그곳으로 이동해요.
            </DialogDescription>
          </div>
          <DialogClose aria-label="전체 흐름 닫기">
            <X size={21} />
          </DialogClose>
        </div>
        <div className="overview-grid">
          {images.map((image, index) => (
            <button
              key={image.src}
              className="overview-scene"
              ref={index === active ? activePreview : undefined}
              aria-current={index === active ? 'location' : undefined}
              aria-label={`${index + 1}번째 부분으로 이동${index === active ? ', 읽는 중' : ''}`}
              onClick={() => {
                pendingJump.current = index;
                jumpTarget.current = section(index) || null;
                setOpen(false);
              }}
            >
              <div>
                <img
                  src={assetPath(image.poster || image.src)}
                  width={image.width}
                  height={image.height}
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
              </div>
              <span>
                {String(index + 1).padStart(2, '0')}
                <span>{index === active ? '읽는 중' : '여기부터 보기'}</span>
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
