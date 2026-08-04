let audioCtx = null;
let enabled = false;

export function setSoundsEnabled(v) {
  enabled = v;
  if (typeof window !== 'undefined') {
    localStorage.setItem('collectable-sounds', v ? '1' : '0');
  }
}

export function getSoundsEnabled() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('collectable-sounds') === '1';
}

enabled = getSoundsEnabled();

function tone(freq, duration, type = 'sine', volume = 0.06) {
  if (!enabled) return;
  if (typeof window === 'undefined') return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export const sfx = {
  click: () => tone(800, 0.04, 'sine', 0.03),
  pop: () => tone(600, 0.08, 'sine', 0.05),
  sparkle: () => {
    tone(1200, 0.05);
    setTimeout(() => tone(1600, 0.08), 50);
  },
  success: () => {
    tone(523, 0.08);
    setTimeout(() => tone(659, 0.08), 80);
    setTimeout(() => tone(784, 0.15), 160);
  },
  error: () => tone(200, 0.15, 'sawtooth', 0.04),
};