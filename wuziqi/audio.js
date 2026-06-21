'use strict';

/* ===== audio.js — Web Audio API generated sound effects for Gomoku =====
 *
 * Self-contained module. Loaded via <script src="audio.js" defer> after game.js.
 * Does NOT depend on any game.js symbols; degrades gracefully if Web Audio API
 * is unavailable.
 *
 * Globals exposed (Wave 2.5 integration points):
 *   initAudio()                   — call once on DOMContentLoaded
 *   playPlaceSound()              — short stone placement blip
 *   playCheerSound(lineLength)    — ascending N-note arpeggio (3..5)
 *   playWinSound()                — 5-note triumph melody + bass boom
 *   setSoundEnabledInternal(enabled) — boolean toggle (internal hook; settings.js
 *                                     owns the canonical setSoundEnabled)
 *   getSoundEnabledInternal()       — returns current toggle state (internal hook)
 *
 * All play* functions are best-effort: no exceptions ever bubble to caller.
 */

/* ===== Module state ===== */
let audioCtx = null;
let soundEnabled = true;

/* ===== AudioContext lazy creation + resume =====
 * Returns the shared AudioContext, creating it on first call and resuming it
 * if suspended (mobile browsers start AudioContext in 'suspended' state until
 * a user gesture unlocks it). Returns null if Web Audio API is unavailable. */
function getAudioContext() {
  if (audioCtx === null) {
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    } catch (e) {
      audioCtx = null;
      console.debug('audio.js: AudioContext creation failed:', e);
      return null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(function (err) {
      console.debug('audio.js: AudioContext resume failed:', err);
    });
  }
  return audioCtx;
}

/* ===== First-touch unlock =====
 * iOS Safari / Android Chrome require AudioContext to be created/resumed
 * inside a user gesture handler. We attach a one-time capture-phase
 * pointerdown listener that unlocks audio on the first interaction. */
function unlockAudio() {
  getAudioContext();
}

function initAudio() {
  try {
    document.addEventListener('pointerdown', unlockAudio, {
      once: true,
      capture: true,
    });
  } catch (e) {
    console.debug('audio.js: initAudio listener attach failed:', e);
  }
}

/* ===== Envelope helper =====
 * Plays a single oscillator tone with an attack/sustain/release envelope.
 * Times are seconds from ctx baseTime. All Web Audio ops are wrapped so a
 * failure in one tone never aborts the surrounding sound. */
function playTone(freq, startTime, attack, sustain, release, peakGain, type) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.connect(gain);
    gain.connect(ctx.destination);

    const sustainStart = startTime + attack;
    const releaseStart = sustainStart + sustain;
    const endTime = releaseStart + release;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, sustainStart);
    gain.gain.setValueAtTime(peakGain, releaseStart);
    gain.gain.linearRampToValueAtTime(0, endTime);

    osc.start(startTime);
    osc.stop(endTime + 0.02);
  } catch (e) {
    console.debug('audio.js: playTone failed:', e);
  }
}

/* ===== Sound: stone placement =====
 * Short crisp sine blip. 800Hz, attack 5ms, sustain 50ms, release 100ms
 * (total ~155ms, within the 100–200ms target). Peak gain 0.15 to avoid
 * clipping when overlapping other sounds. */
function playPlaceSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    playTone(800, now, 0.005, 0.050, 0.100, 0.15, 'sine');
  } catch (e) {
    console.debug('audio.js: playPlaceSound failed:', e);
  }
}

/* ===== Sound: cheer (ascending arpeggio) =====
 * N notes from a C5 major-ish series [C5, E5, G5, B5, D6] =
 * [523, 659, 784, 988, 1175] Hz. Each note: attack 10ms, sustain 60ms,
 * release 80ms, peak 0.12, spaced 100ms apart (slight overlap for legato).
 * lineLength is clamped to [0,5]; 0/invalid is a silent no-op. */
function playCheerSound(lineLength) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const n = Math.max(0, Math.min(5, Math.floor(lineLength) || 0));
    if (n === 0) return;
    const freqs = [523, 659, 784, 988, 1175];
    const stepSec = 0.100;
    const now = ctx.currentTime;
    for (let i = 0; i < n; i++) {
      playTone(freqs[i], now + i * stepSec, 0.010, 0.060, 0.080, 0.12, 'sine');
    }
  } catch (e) {
    console.debug('audio.js: playCheerSound failed:', e);
  }
}

/* ===== Sound: victory melody =====
 * 5-note triumph melody C5–E5–G5–C6–G5 = [523, 659, 784, 1047, 784] Hz,
 * triangle timbre for a brassier/triumphant color (vs. sine place/cheer).
 * Each note 150ms total (10ms attack / 110ms sustain / 30ms release).
 * Followed by a booming low C3 (130Hz) sine tail for emphasis.
 * Total ~900ms — perceptibly longer and grander than the cheer arpeggio. */
function playWinSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const melody = [523, 659, 784, 1047, 784];
    const noteSec = 0.150;
    const now = ctx.currentTime;
    for (let i = 0; i < melody.length; i++) {
      playTone(melody[i], now + i * noteSec, 0.010, 0.110, 0.030, 0.15, 'triangle');
    }
    // Booming low C3 tail, overlapping the final melody note.
    const boomStart = now + (melody.length - 1) * noteSec;
    playTone(130, boomStart, 0.020, 0.300, 0.200, 0.18, 'sine');
  } catch (e) {
    console.debug('audio.js: playWinSound failed:', e);
  }
}

/* ===== Sound toggle (internal hook) =====
 * settings.js owns the canonical window.setSoundEnabled / getSoundEnabled
 * (it is loaded last and wins the global name). It delegates here via
 * setSoundEnabledInternal / getSoundEnabledInternal during Wave 2.5. */
function setSoundEnabledInternal(enabled) {
  soundEnabled = !!enabled;
}

function getSoundEnabledInternal() {
  return soundEnabled;
}
