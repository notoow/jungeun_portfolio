import { useEffect, useRef, useState, type RefObject } from 'react';
import { assetPath } from '@/lib/portfolio';
import type { MeadowRenderer } from './meadow-renderer';

export type MeadowInput = { x: number; y: number };

export default function MeadowScene({
  motion,
  input,
}: {
  motion: boolean;
  input: RefObject<MeadowInput>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const enabled = useRef(motion);
  const renderer = useRef<MeadowRenderer | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    enabled.current = motion;
    renderer.current?.setMotion(motion);
  }, [motion]);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const abort = new AbortController();
    void import('./meadow-renderer')
      .then(async ({ mountMeadowRenderer }) => {
        if (abort.signal.aborted) return;
        const scene = await mountMeadowRenderer(
          container,
          () => input.current,
          () => enabled.current,
          setReady,
          abort.signal,
        );
        if (abort.signal.aborted) scene?.dispose();
        else renderer.current = scene;
      })
      .catch(() => {
        /* The photograph remains available without WebGL. */
      });
    return () => {
      abort.abort();
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, [input]);
  return (
    <div className={`meadow-art ${ready ? 'is-ready' : ''}`}>
      <picture className="meadow-photograph">
        <source
          media="(max-width: 799px) and (orientation: portrait)"
          srcSet={assetPath('meadow/portrait.webp')}
        />
        <img
          src={assetPath('meadow/landscape.webp')}
          alt="햇빛 아래 흰 데이지와 작은 노란 꽃이 피어 있는 자연스러운 야생화 꽃밭"
          fetchPriority="high"
        />
      </picture>
      <div className="meadow-canvas" ref={host} aria-hidden="true" />
    </div>
  );
}
