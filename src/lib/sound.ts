/** Tiny WebAudio sound effects — no audio files needed. */

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.15, when = 0) {
  const c = ac();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + when;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  tap: () => tone(520, 0.09, "triangle", 0.12),
  cardIn: () => tone(392, 0.12, "sine", 0.08),
  tick: () => tone(880, 0.05, "square", 0.05),
  success: () => {
    tone(523.25, 0.12, "triangle", 0.14);
    tone(659.25, 0.12, "triangle", 0.14, 0.09);
    tone(783.99, 0.2, "triangle", 0.14, 0.18);
  },
  fail: () => {
    tone(220, 0.25, "sawtooth", 0.1);
    tone(160, 0.35, "sawtooth", 0.1, 0.12);
  },
  topicClear: () => {
    tone(440, 0.1, "sine", 0.12);
    tone(554.37, 0.1, "sine", 0.12, 0.08);
    tone(659.25, 0.18, "sine", 0.12, 0.16);
  },
  win: () => {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    notes.forEach((n, i) => tone(n, 0.22, "triangle", 0.15, i * 0.13));
  },
  click: () => tone(300, 0.05, "sine", 0.06),
};
