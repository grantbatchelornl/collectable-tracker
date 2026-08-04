import confetti from 'canvas-confetti';

export function haptic(pattern = 10) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export function celebrateBig() {
  haptic([10, 30, 10, 30, 20]);
  const count = 200;
  const defaults = { origin: { y: 0.7 }, colors: ['#6366f1', '#f59e0b', '#22c55e', '#ec4899'] };
  function fire(particleRatio, opts) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

export function celebrateSmall() {
  haptic(20);
  confetti({
    particleCount: 50,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#6366f1', '#f59e0b', '#22c55e'],
    scalar: 0.9,
  });
}