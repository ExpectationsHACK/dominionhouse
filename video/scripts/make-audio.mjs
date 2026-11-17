// Builds the placeholder sound bed, public/audio/sgb-bed.wav (25 s, 44.1 kHz,
// 16-bit stereo), timed to SYNC in src/config.ts. Replace it with a real track
// that hits the same frames: drop the file in public/audio/ under the same name.
//
//   pad      0 → end            low ambient drone, slow swell
//   hit      frame 42           soft low hit on "BUT WANTING ISN'T ENOUGH."
//   whoosh   frame 140          flare: "It's time to break it."
//   riser    frames 120 → 184   builds into…
//   hit      frame 184          …the title hit
//   ticks    270, 305, 340, 375, 410, 445   one per card
//   clock    480 → 569          soft ticks, two a second
//   swell    570                the decision
//   resolve  660                chord at the CTA, rings to the end
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../public/audio/sgb-bed.wav");
// Renders call this first; it leaves an existing file (e.g. a real track) alone.
if (existsSync(OUT) && !process.argv.includes("--force")) process.exit(0);
const FPS = 30;
const RATE = 44100;
const SECONDS = 25;
const N = RATE * SECONDS;
const L = new Float32Array(N);
const R = new Float32Array(N);
const f2s = (frame) => Math.round((frame / FPS) * RATE);

let seed = 7;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 31 - 1;
};

const add = (i, l, r = l) => {
  if (i >= 0 && i < N) {
    L[i] += l;
    R[i] += r;
  }
};

// Pad: detuned low sines, a fifth and an octave, swelling with the story.
const swell = (t) => {
  const f = t * FPS;
  if (f < 90) return 0.5 + 0.3 * (f / 90);
  if (f < 140) return 0.8 - 0.45 * ((f - 90) / 50); // complacency thins it out
  if (f < 184) return 0.35 + 0.5 * ((f - 140) / 44);
  if (f < 570) return 0.8;
  if (f < 660) return 0.8 + 0.25 * ((f - 570) / 90);
  return 1.05 - 0.6 * Math.max(0, (f - 700) / 50);
};
for (let i = 0; i < N; i++) {
  const t = i / RATE;
  const fadeIn = Math.min(1, t / 1.2);
  const fadeOut = Math.min(1, (SECONDS - t) / 0.6);
  const lfo = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.11 * t);
  const v =
    0.06 * Math.sin(2 * Math.PI * 55 * t) +
    0.05 * Math.sin(2 * Math.PI * 55.4 * t) +
    0.035 * Math.sin(2 * Math.PI * 82.4 * t) +
    0.02 * Math.sin(2 * Math.PI * 110.3 * t + Math.sin(t * 0.7));
  const g = v * swell(t) * lfo * fadeIn * fadeOut;
  add(i, g * (1 + 0.1 * Math.sin(t * 0.5)), g * (1 - 0.1 * Math.sin(t * 0.5)));
}

// Low hit: a falling sine thump plus a short noise transient.
function hit(frame, gain = 1, length = 1.6) {
  const s = f2s(frame);
  let phase = 0;
  for (let k = 0; k < RATE * length; k++) {
    const t = k / RATE;
    const freq = 38 + 70 * Math.exp(-t * 12);
    phase += (2 * Math.PI * freq) / RATE;
    const body = Math.sin(phase) * Math.exp(-t * 2.6);
    const click = noise() * Math.exp(-t * 60) * 0.35;
    const v = (body * 0.55 + click) * gain;
    add(s + k, v, v);
  }
}

// Riser: filtered noise and a rising tone, cut off right on the hit.
function riser(from, to, gain = 0.25) {
  const s = f2s(from);
  const e = f2s(to);
  let lp = 0;
  let phase = 0;
  for (let i = s; i < e; i++) {
    const p = (i - s) / (e - s);
    const cutoff = 0.02 + p * p * 0.35;
    lp += cutoff * (noise() - lp);
    phase += (2 * Math.PI * (180 + 520 * p * p)) / RATE;
    const v = (lp * 0.9 + Math.sin(phase) * 0.12) * p * p * gain;
    add(i, v * (1 - 0.3 * p), v * (0.7 + 0.3 * p));
  }
}

// Whoosh: a noise burst with a quick sweep.
function whoosh(frame, gain = 0.3) {
  const s = f2s(frame - 6);
  let lp = 0;
  for (let k = 0; k < RATE * 0.9; k++) {
    const t = k / RATE;
    const env = Math.min(1, t / 0.18) * Math.exp(-Math.max(0, t - 0.18) * 6);
    lp += (0.05 + 0.3 * Math.exp(-t * 3)) * (noise() - lp);
    add(s + k, lp * env * gain, lp * env * gain * 0.85);
  }
}

// Tick: a short, soft percussive click.
function tick(frame, gain = 0.25, pitch = 2400) {
  const s = f2s(frame);
  for (let k = 0; k < RATE * 0.08; k++) {
    const t = k / RATE;
    const v = (Math.sin(2 * Math.PI * pitch * t) * 0.6 + noise() * 0.4) * Math.exp(-t * 70) * gain;
    add(s + k, v, v);
  }
}

// Resolve: an open A major chord that rings out.
function chord(frame, gain = 0.12) {
  const s = f2s(frame);
  const notes = [110, 164.8, 220, 277.2, 329.6, 440];
  for (let k = 0; s + k < N; k++) {
    const t = k / RATE;
    const env = Math.min(1, t / 0.25) * Math.exp(-t * 0.5);
    let v = 0;
    notes.forEach((f, n) => {
      v += Math.sin(2 * Math.PI * f * t + n) * (n < 2 ? 1 : 0.6);
    });
    add(s + k, v * env * gain * 0.6, v * env * gain * 0.55);
  }
}

hit(42, 0.55, 1.2);
riser(120, 184);
whoosh(140, 0.35);
hit(184, 1, 2);
[270, 305, 340, 375, 410, 445].forEach((f, i) => tick(f, 0.22, 2000 + i * 120));
for (let f = 480; f < 570; f += 15) tick(f, 0.09, 3200);
hit(570, 0.45, 1.6);
riser(630, 660, 0.15);
hit(660, 0.6, 2);
chord(660);

// Normalise to -1 dBFS and write 16-bit stereo PCM.
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const scale = (10 ** (-1 / 20)) / (peak || 1);
const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * scale)) * 32767), i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * scale)) * 32767), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(RATE, 24);
header.writeUInt32LE(RATE * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, Buffer.concat([header, data]));
console.log(`wrote ${OUT}`);
