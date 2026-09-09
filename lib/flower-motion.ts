export type FlowerSpring = { x: number; z: number; vx: number; vz: number };
export type BrushPoint = { x: number; y: number };

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/** A damped stem, integrated in short steps even after a slow frame. */
export function stepFlower(
  s: FlowerSpring,
  x: number,
  z: number,
  delta: number,
) {
  let remaining = clamp(delta, 0, 0.1);
  while (remaining > 0) {
    const dt = Math.min(remaining, 1 / 120);
    s.vx += ((x - s.x) * 42 - s.vx * 6.4) * dt;
    s.vz += ((z - s.z) * 42 - s.vz * 6.4) * dt;
    s.x += s.vx * dt;
    s.z += s.vz * dt;
    if (Math.abs(s.x - x) > 1.2) {
      s.x = x + Math.sign(s.x - x) * 1.2;
      s.vx *= -0.2;
    }
    if (Math.abs(s.z - z) > 0.85) {
      s.z = z + Math.sign(s.z - z) * 0.85;
      s.vz *= -0.2;
    }
    remaining -= dt;
  }
}

/** Distance to the entire stroke prevents fast swipes skipping small flowers. */
export function strokeInfluence(
  point: BrushPoint,
  from: BrushPoint,
  to: BrushPoint,
  radius: number,
) {
  if (radius <= 0) return 0;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = dx * dx + dy * dy;
  const t = length
    ? clamp(((point.x - from.x) * dx + (point.y - from.y) * dy) / length, 0, 1)
    : 0;
  const d =
    Math.hypot(point.x - from.x - dx * t, point.y - from.y - dy * t) / radius;
  if (d >= 1) return 0;
  return (1 - d * d) ** 2;
}

export function strokeFlower(
  s: FlowerSpring,
  influence: number,
  dx: number,
  dy: number,
) {
  if (influence <= 0) return;
  s.vx = clamp(s.vx + clamp(dx * 0.028, -2.8, 2.8) * influence, -4.5, 4.5);
  s.vz = clamp(s.vz + (clamp(dy * 0.018, -1.8, 1.8) + 0.65) * influence, -3, 3);
}

export function meadowJourney(progress: number) {
  const ease = (start: number, end: number) => {
    const t = clamp((progress - start) / (end - start), 0, 1);
    return t * t * (3 - 2 * t);
  };
  return {
    travel: ease(0.06, 0.82),
    open: ease(0.24, 0.78),
    exit: ease(0.76, 1),
  };
}
