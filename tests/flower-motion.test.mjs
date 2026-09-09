import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stepFlower,
  strokeFlower,
  strokeInfluence,
  meadowJourney,
} from '../lib/flower-motion.ts';

test('a fast swipe touches flowers between pointer samples, not distant flowers', () => {
  const from = { x: 0, y: 100 },
    to = { x: 400, y: 100 };
  assert.equal(strokeInfluence({ x: 200, y: 100 }, from, to, 70), 1);
  assert.equal(strokeInfluence({ x: 200, y: 180 }, from, to, 70), 0);
  assert.ok(strokeInfluence({ x: 200, y: 130 }, from, to, 70) > 0);
});

test('a touch bends a stem, overshoots, and settles back after release', () => {
  const s = { x: 0, z: 0, vx: 0, vz: 0 };
  strokeFlower(s, 1, 90, 0);
  stepFlower(s, 0, 0, 1 / 60);
  assert.ok(s.x > 0 && s.z > 0);
  let overshot = false;
  for (let i = 0; i < 600; i++) {
    stepFlower(s, 0, 0, 1 / 60);
    overshot ||= s.x < 0;
  }
  assert.ok(overshot);
  assert.ok(Math.abs(s.x) + Math.abs(s.z) + Math.abs(s.vx) < 0.0001);
});

test('return remains consistent at 30, 60 and 120 fps; a stalled frame stays bounded', () => {
  const states = [30, 60, 120].map((fps) => {
    const s = { x: 0, z: 0, vx: 3, vz: -2 };
    for (let i = 0; i < fps; i++) stepFlower(s, 0.2, -0.1, 1 / fps);
    return s;
  });
  const reference = { ...states[0] };
  for (const s of states) {
    assert.ok(Math.abs(s.x - reference.x) < 0.005);
    assert.ok(Math.abs(s.z - reference.z) < 0.005);
    stepFlower(s, 0, 0, 20);
    assert.ok(Number.isFinite(s.x) && Math.abs(s.x) < 1);
  }
});

test('continuous touch input stays bounded and does not affect untouched flowers', () => {
  const s = { x: 0, z: 0, vx: 0, vz: 0 };
  strokeFlower(s, 0, 1000, 1000);
  assert.deepEqual(s, { x: 0, z: 0, vx: 0, vz: 0 });
  for (let i = 0; i < 1800; i++) {
    strokeFlower(s, 1, 500, -500);
    stepFlower(s, 0, 0, 1 / 60);
  }
  assert.ok(Math.abs(s.x) < 3 && Math.abs(s.z) < 3);
});

test('scroll choreography is reversible and clamps at the ends', () => {
  assert.deepEqual(meadowJourney(-1), { travel: 0, open: 0, exit: 0 });
  assert.deepEqual(meadowJourney(2), { travel: 1, open: 1, exit: 1 });
  const halfway = meadowJourney(0.5);
  assert.ok(halfway.travel > 0 && halfway.travel < 1 && halfway.exit === 0);
  meadowJourney(1);
  assert.deepEqual(meadowJourney(0.5), halfway);
});
