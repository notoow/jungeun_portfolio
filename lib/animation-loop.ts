/** Schedule only visible work; paused scenes can still request a single redraw. */
export function createAnimationLoop(
  draw: (elapsed: number) => void,
  requestFrame = requestAnimationFrame,
  cancelFrame = cancelAnimationFrame,
) {
  let frame: number | null = null;
  let active = false;
  let visible = false;
  let disposed = false;
  let elapsed = 0;
  let previous: number | null = null;

  function invalidate() {
    if (!disposed && visible && frame === null) frame = requestFrame(tick);
  }
  function stop() {
    if (frame !== null) cancelFrame(frame);
    frame = null;
    previous = null;
  }
  function tick(now: number) {
    frame = null;
    if (disposed || !visible) return;
    if (active && previous !== null) elapsed += Math.min(100, now - previous);
    previous = active ? now : null;
    draw(elapsed);
    if (active) invalidate();
  }
  return {
    invalidate,
    setActive(value: boolean) {
      if (active === value) return;
      active = value;
      stop();
      invalidate();
    },
    setVisible(value: boolean) {
      if (visible === value) return;
      visible = value;
      if (!visible) stop();
      else invalidate();
    },
    dispose() {
      disposed = true;
      stop();
    },
  };
}
