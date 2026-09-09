import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnimationLoop } from '../lib/animation-loop.ts';

function scene() {
  let id = 0;
  const pending = new Map();
  const draws = [];
  const loop = createAnimationLoop(
    (elapsed) => draws.push(elapsed),
    (callback) => {
      pending.set(++id, callback);
      return id;
    },
    (key) => pending.delete(key),
  );
  return {
    loop,
    draws,
    pending,
    tick(now) {
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback(now));
    },
  };
}

test('offscreen and background scenes leave no animation frames scheduled', () => {
  const { loop, pending, tick, draws } = scene();
  loop.setActive(true);
  assert.equal(pending.size, 0);
  loop.setVisible(true);
  tick(0);
  assert.equal(pending.size, 1);
  loop.setVisible(false);
  loop.invalidate();
  assert.equal(pending.size, 0);
  tick(60_000);
  assert.equal(draws.length, 1);
});

test('paused scenes redraw once for resize or a motion preference change', () => {
  const { loop, pending, tick, draws } = scene();
  loop.setVisible(true);
  tick(0);
  assert.equal(pending.size, 0);
  loop.invalidate();
  loop.invalidate();
  assert.equal(pending.size, 1);
  tick(16);
  assert.equal(pending.size, 0);
  loop.setActive(true);
  tick(32);
  loop.setActive(false);
  tick(48);
  assert.equal(pending.size, 0);
  assert.equal(draws.length, 4);
});

test('returning to the scene continues breathing without a hidden-tab time jump', () => {
  const { loop, tick, draws } = scene();
  loop.setActive(true);
  loop.setVisible(true);
  tick(0);
  tick(16);
  loop.setVisible(false);
  loop.setVisible(true);
  tick(60_000);
  tick(60_016);
  assert.deepEqual(draws, [0, 16, 16, 32]);
});

test('disposing the scene cancels pending work and prevents future restarts', () => {
  const { loop, pending, tick, draws } = scene();
  loop.setActive(true);
  loop.setVisible(true);
  loop.dispose();
  loop.setActive(false);
  loop.setVisible(false);
  loop.setActive(true);
  loop.setVisible(true);
  loop.invalidate();
  assert.equal(pending.size, 0);
  tick(100);
  assert.deepEqual(draws, []);
});
