// Builds the campaign teaser's placeholder bed, public/audio/sgb-campaign-bed.wav
// (27 s, 120 bpm, 44.1 kHz stereo), timed to CAMPAIGN_SYNC in
// src/campaign/config.ts. A real track at 120 bpm starting on frame 0 lines up
// with the cuts (every scene starts on a beat: one beat = 15 frames).
//
//   groove   0 → 780        kick, clap, hats, bass (A – F#m – D – E, one chord per bar)
//   whoosh   138, 288, 408, 540, 693   the round wipes
//   thud     238            "Not by chance" stamp
//   fall     308            gauge empties;  rise 384: refuel
//   dings    430, 439, 448, 457, and 526 for the prayer-life tick
//   hit      554            BOOTCAMP lands;  final hit 780, then a short tail
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../public/audio/sgb-campaign-bed.wav");
if (existsSync(OUT) && !process.argv.includes("--force")) process.exit(0);

const FPS = 30;
const RATE = 44100;
const SECONDS = 27;
const N = RATE * SECONDS;
const L = new Float32Array(N);
const R = new Float32Array(N);
const f2s = (f) => Math.round((f / FPS) * RATE);
let seed = 11;
const noise = () => ((seed = (seed * 1664525 + 1013904223) >>> 0), seed / 2 ** 31 - 1);
const add = (i, l, r = l) => {
  if (i >= 0 && i < N) {
    L[i] += l;
    R[i] += r;
  }
};

const BEAT = 15; // frames
const END = 780; // groove stops here (final hit)

function kick(f, g = 0.9) {
  const s = f2s(f);
  let ph = 0;
  for (let k = 0; k < RATE * 0.35; k++) {
    const t = k / RATE;
    ph += (2 * Math.PI * (45 + 110 * Math.exp(-t * 28))) / RATE;
    const v = Math.sin(ph) * Math.exp(-t * 9) * g;
    add(s + k, v);
  }
}
function clap(f, g = 0.35) {
  const s = f2s(f);
  let hp = 0, prev = 0;
  for (let k = 0; k < RATE * 0.22; k++) {
    const t = k / RATE;
    const n = noise();
    hp = 0.85 * (hp + n - prev);
    prev = n;
    const env = (t < 0.012 ? 1 : 0.6) * Math.exp(-t * 18);
    add(s + k, hp * env * g * 0.9, hp * env * g);
  }
}
function hat(f, g = 0.08, open = false) {
  const s = f2s(f);
  let hp = 0, prev = 0;
  for (let k = 0; k < RATE * (open ? 0.18 : 0.05); k++) {
    const t = k / RATE;
    const n = noise();
    hp = 0.6 * (hp + n - prev);
    prev = n;
    const v = hp * Math.exp(-t * (open ? 18 : 70)) * g;
    add(s + k, v * 0.8, v);
  }
}
function pluck(f, hz, len = 0.42, g = 0.22) {
  const s = f2s(f);
  for (let k = 0; k < RATE * len; k++) {
    const t = k / RATE;
    const v = (Math.sin(2 * Math.PI * hz * t) + 0.35 * Math.sin(2 * Math.PI * hz * 2 * t)) * Math.exp(-t * 6) * Math.min(1, t * 400) * g;
    add(s + k, v);
  }
}
function chordStab(f, notes, g = 0.05) {
  const s = f2s(f);
  for (let k = 0; k < RATE * 0.5; k++) {
    const t = k / RATE;
    let v = 0;
    notes.forEach((hz, n) => (v += Math.sin(2 * Math.PI * hz * t + n) + 0.3 * Math.sin(2 * Math.PI * hz * 2.01 * t)));
    const env = Math.min(1, t * 200) * Math.exp(-t * 7) * g;
    add(s + k, v * env * 0.9, v * env);
  }
}
function whoosh(f, g = 0.3) {
  const s = f2s(f - 8);
  let lp = 0;
  for (let k = 0; k < RATE * 0.7; k++) {
    const t = k / RATE;
    const env = Math.min(1, t / 0.24) * Math.exp(-Math.max(0, t - 0.24) * 9);
    lp += (0.04 + 0.4 * Math.min(1, t / 0.24)) * (noise() - lp);
    add(s + k, lp * env * g, lp * env * g * 0.8);
  }
}
function tone(f, from, to, len, g = 0.12) {
  const s = f2s(f);
  let ph = 0;
  for (let k = 0; k < RATE * len; k++) {
    const p = k / (RATE * len);
    ph += (2 * Math.PI * (from + (to - from) * p)) / RATE;
    const env = Math.sin(Math.PI * p) * g;
    add(s + k, Math.sin(ph) * env, Math.sin(ph * 1.003) * env);
  }
}
function ding(f, hz = 1568, g = 0.14) {
  const s = f2s(f);
  for (let k = 0; k < RATE * 0.6; k++) {
    const t = k / RATE;
    const v = (Math.sin(2 * Math.PI * hz * t) + 0.4 * Math.sin(2 * Math.PI * hz * 2.76 * t)) * Math.exp(-t * 7) * g;
    add(s + k, v);
  }
}

// Groove: chords A, F#m, D, E (one per bar of four beats).
const CHORDS = [
  { root: 110, notes: [220, 277.18, 329.63] },
  { root: 92.5, notes: [185, 220, 277.18] },
  { root: 73.42, notes: [146.83, 185, 220] },
  { root: 82.41, notes: [164.81, 207.65, 246.94] },
];
for (let f = 0; f < END; f += BEAT) {
  const beat = f / BEAT;
  const bar = Math.floor(beat / 4);
  const chord = CHORDS[bar % 4];
  const quiet = f < 60; // first bar: hats and bass only, then the drums come in
  if (!quiet) kick(f, beat % 4 === 2 ? 0.75 : 0.9);
  if (!quiet && beat % 2 === 1) clap(f);
  hat(f + BEAT / 2, 0.07, beat % 4 === 3);
  hat(f, 0.04);
  pluck(f, chord.root, 0.3, beat % 2 === 0 ? 0.24 : 0.16);
  if (beat % 4 === 0) chordStab(f, chord.notes);
  if (beat % 4 === 1) chordStab(f + BEAT / 2, chord.notes, 0.035);
}

[138, 288, 408, 540, 693].forEach((f) => whoosh(f));
kick(238, 1.1); // stamp
clap(238, 0.25);
tone(308, 520, 120, 0.8, 0.1); // gauge falls
tone(384, 160, 760, 0.95, 0.1); // refuel
[430, 439, 448, 457].forEach((f, i) => ding(f, 1318.5 + i * 110, 0.1));
ding(526, 1760, 0.16);
ding(529, 2349, 0.08);
kick(554, 1.1);
chordStab(554, [440, 554.37, 659.25], 0.07);
kick(780, 1.2);
chordStab(780, [220, 277.18, 329.63, 440], 0.09);
tone(780, 440, 440, 0.9, 0.04);

let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const scale = 10 ** (-1 / 20) / (peak || 1);
const fadeFrom = N - RATE * 0.4;
const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  const fade = i > fadeFrom ? 1 - (i - fadeFrom) / (N - fadeFrom) : 1;
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * scale * fade)) * 32767), i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * scale * fade)) * 32767), i * 4 + 2);
}
const h = Buffer.alloc(44);
h.write("RIFF", 0);
h.writeUInt32LE(36 + data.length, 4);
h.write("WAVE", 8);
h.write("fmt ", 12);
h.writeUInt32LE(16, 16);
h.writeUInt16LE(1, 20);
h.writeUInt16LE(2, 22);
h.writeUInt32LE(RATE, 24);
h.writeUInt32LE(RATE * 4, 28);
h.writeUInt16LE(4, 32);
h.writeUInt16LE(16, 34);
h.write("data", 36);
h.writeUInt32LE(data.length, 40);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, Buffer.concat([h, data]));
console.log(`wrote ${OUT}`);
