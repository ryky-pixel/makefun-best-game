// Orbital Sentinel — synthesized sound effects.
// No audio files: every sound is built from oscillators and filtered
// noise through the Web Audio API, so the game ships zero bytes of audio
// and makes no network request. The context is created lazily on the
// first user gesture (browsers block audio before that) and every play
// call is a no-op until then, or while muted.

export function createAudio() {
  let context = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') void context.resume();
      return true;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0.16;
    master.connect(context.destination);
    return true;
  }

  function tone({ from, to, seconds, type = 'sine', volume = 1, delay = 0 }) {
    if (!context || muted) return;
    const start = context.currentTime + delay;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + seconds);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  }

  function noise({ seconds, volume = 1, lowpass = 1200, delay = 0 }) {
    if (!context || muted) return;
    const start = context.currentTime + delay;
    const length = Math.max(1, Math.floor(context.sampleRate * seconds));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(start);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    shoot() {
      tone({ from: 880, to: 420, seconds: 0.07, type: 'square', volume: 0.5 });
    },
    explosion() {
      noise({ seconds: 0.28, volume: 0.9, lowpass: 900 });
      tone({ from: 160, to: 40, seconds: 0.25, type: 'sine', volume: 0.8 });
    },
    planetHit() {
      noise({ seconds: 0.35, volume: 1, lowpass: 500 });
      tone({ from: 110, to: 30, seconds: 0.4, type: 'sawtooth', volume: 0.7 });
    },
    pickup() {
      tone({ from: 1320, to: 1760, seconds: 0.09, type: 'sine', volume: 0.5 });
    },
    waveClear() {
      tone({ from: 523, to: 523, seconds: 0.12, type: 'triangle', volume: 0.6 });
      tone({ from: 659, to: 659, seconds: 0.12, type: 'triangle', volume: 0.6, delay: 0.11 });
      tone({ from: 784, to: 784, seconds: 0.2, type: 'triangle', volume: 0.6, delay: 0.22 });
    },
    victory() {
      [523, 659, 784, 1047].forEach((note, i) => {
        tone({ from: note, to: note, seconds: 0.22, type: 'triangle', volume: 0.6, delay: i * 0.14 });
      });
    },
    defeat() {
      [392, 330, 262, 196].forEach((note, i) => {
        tone({ from: note, to: note, seconds: 0.25, type: 'sawtooth', volume: 0.45, delay: i * 0.16 });
      });
    },
  };
}
