'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { assetPath } from '@/lib/portfolio';
import type { DreamRenderer } from './dream-renderer';

export type DreamInput = { x: number; y: number };

/** Independently positioned photographic layers in a perspective scene. */
export default function DreamScene({
  motion,
  input,
}: {
  motion: boolean;
  input: RefObject<DreamInput>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const enabled = useRef(motion);
  const renderer = useRef<DreamRenderer | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    enabled.current = motion;
    renderer.current?.setMotion(motion);
  }, [motion]);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const abort = new AbortController();
    void import('./dream-renderer')
      .then(async ({ mountDreamRenderer }) => {
        if (abort.signal.aborted) return;
        const scene = await mountDreamRenderer(
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
        /* Keep the accessible fallback image. */
      });
    return () => {
      abort.abort();
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, [input]);
  return (
    <div className={`dream-art ${ready ? 'is-webgl' : ''}`}>
      <div className="dream-fallback">
        <img
          className="fallback-baby"
          src={assetPath('hero/sleeping-baby.webp')}
          width="1254"
          height="1254"
          alt="파란 하늘, 포근한 흰 담요 속에 잠든 아기"
          fetchPriority="high"
        />
        <img
          className="fallback-cloud cloud-left"
          src={assetPath('hero/cloud.webp')}
          width="2172"
          height="724"
          alt=""
        />
        <img
          className="fallback-cloud cloud-right"
          src={assetPath('hero/cloud.webp')}
          width="2172"
          height="724"
          alt=""
        />
      </div>
      <div className="dream-canvas" ref={host} aria-hidden="true" />
    </div>
  );
}
