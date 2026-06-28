// Sound effects using Web Audio API — no external audio files needed
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export type SoundType = 'select' | 'deselect' | 'dispatch' | 'victory' | 'defeat' | 'note' | 'accuse' | 'click';

const SOUND_CONFIGS: Record<SoundType, { frequency: number; duration: number; type: OscillatorType; gain: number; ramp?: number }[]> = {
  select: [
    { frequency: 523, duration: 0.08, type: 'sine', gain: 0.15 },
    { frequency: 659, duration: 0.08, type: 'sine', gain: 0.12 },
  ],
  deselect: [
    { frequency: 440, duration: 0.1, type: 'sine', gain: 0.1 },
  ],
  dispatch: [
    { frequency: 392, duration: 0.15, type: 'triangle', gain: 0.2 },
    { frequency: 523, duration: 0.15, type: 'triangle', gain: 0.15 },
    { frequency: 659, duration: 0.2, type: 'triangle', gain: 0.1 },
  ],
  victory: [
    { frequency: 523, duration: 0.15, type: 'sine', gain: 0.2 },
    { frequency: 659, duration: 0.15, type: 'sine', gain: 0.2 },
    { frequency: 784, duration: 0.15, type: 'sine', gain: 0.2 },
    { frequency: 1047, duration: 0.4, type: 'sine', gain: 0.25 },
  ],
  defeat: [
    { frequency: 392, duration: 0.2, type: 'sawtooth', gain: 0.1 },
    { frequency: 330, duration: 0.2, type: 'sawtooth', gain: 0.1 },
    { frequency: 262, duration: 0.5, type: 'sawtooth', gain: 0.12 },
  ],
  note: [
    { frequency: 880, duration: 0.05, type: 'sine', gain: 0.08 },
  ],
  accuse: [
    { frequency: 349, duration: 0.2, type: 'square', gain: 0.08 },
    { frequency: 440, duration: 0.3, type: 'square', gain: 0.06 },
  ],
  click: [
    { frequency: 600, duration: 0.03, type: 'sine', gain: 0.08 },
  ],
};

let soundEnabled = true;

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function playSound(type: SoundType): void {
  if (!soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const configs = SOUND_CONFIGS[type];
    let startTime = ctx.currentTime;

    for (const config of configs) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = config.type;
      osc.frequency.setValueAtTime(config.frequency, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(config.gain, startTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, startTime + config.duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + config.duration + 0.01);

      startTime += config.duration * 0.6; // Overlap slightly
    }
  } catch {
    // Silently fail if audio is not available
  }
}
