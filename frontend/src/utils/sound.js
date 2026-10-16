// Web Audio API based synthesized sound generator (No external MP3 files needed)

let audioCtx = null;
let ringtoneInterval = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

// Start telephone ringtone (repeating dual-tone beep)
export const startRingtone = () => {
  stopRingtone();
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playRingBurst = () => {
      try {
        if (!ctx || ctx.state === "closed") return;

        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(440, now); // 440 Hz
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(480, now); // 480 Hz

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gainNode.gain.setValueAtTime(0.15, now + 1.2);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.3);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.35);
        osc2.stop(now + 1.35);
      } catch (err) {
        console.warn("Ringtone error:", err);
      }
    };

    playRingBurst();
    ringtoneInterval = setInterval(playRingBurst, 3000);
  } catch (err) {
    console.warn("AudioContext error:", err);
  }
};

// Stop telephone ringtone
export const stopRingtone = () => {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
};

// Call connected chime
export const playConnectedSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.2); // G5

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (err) {
    console.warn("Connected chime error:", err);
  }
};

// Call ended sound (descending beep)
export const playEndCallSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (err) {
    console.warn("End call sound error:", err);
  }
};
