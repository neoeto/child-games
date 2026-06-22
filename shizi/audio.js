'use strict';

/* ===== audio.js — Web Audio SFX + speechSynthesis for 识字乐园 =====
 *
 * Cloned pattern from wuziqi/audio.js + speechSynthesis for 汉字发音.
 * Loaded via <script src="audio.js" defer> after progress.js.
 *
 * Globals exposed:
 *   initAudio()                   — call once on DOMContentLoaded (unlocks AudioContext on first touch)
 *   initSpeechSynthesis()         — detects zh-CN voice, handles async voiceschanged
 *   speak(char)                   — pronounces a Chinese character via speechSynthesis
 *   isTtsAvailable()              — returns boolean
 *   playPlaceSound()              — UI tap blip
 *   playCorrectSound()            — ascending 3-note arpeggio (correct answer)
 *   playWrongSound()              — gentle descending tone (wrong answer, non-punishing)
 *   playWinSound()                — victory melody (level clear)
 *   setSoundEnabledInternal(bool) — internal hook for settings.js
 *   getSoundEnabledInternal()     — internal hook for settings.js
 *
 * All play* / speak functions are best-effort: no exceptions bubble to caller.
 */

/* ===== Module state ===== */
let audioCtx = null;
let soundEnabled = true;
let ttsAvailable = false;
let speechUnlocked = false;

/* ===== AudioContext lazy creation + resume (cloned from wuziqi) ===== */
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

function initAudio() {
  var unlock = function () {
    getAudioContext();
    speechUnlocked = true;
  };
  var opts = { once: true, capture: true };
  try { document.addEventListener('pointerdown', unlock, opts); } catch (e) {}
  try { document.addEventListener('mousedown', unlock, opts); } catch (e) {}
  try { document.addEventListener('touchstart', unlock, opts); } catch (e) {}
  try { document.addEventListener('keydown', unlock, opts); } catch (e) {}
  initSpeechSynthesis();
}

/* ===== speechSynthesis: detect zh voice (handles async voiceschanged) ===== */
function detectZhVoice() {
  try {
    if (!window.speechSynthesis || typeof window.speechSynthesis.getVoices !== 'function') {
      ttsAvailable = false;
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;
    for (let i = 0; i < voices.length; i++) {
      if (voices[i].lang && voices[i].lang.toLowerCase().indexOf('zh') === 0) {
        ttsAvailable = true;
        return;
      }
    }
    ttsAvailable = false;
  } catch (e) {
    console.debug('audio.js: detectZhVoice failed:', e);
    ttsAvailable = false;
  }
}

function initSpeechSynthesis() {
  if (!window.speechSynthesis) {
    ttsAvailable = false;
    return;
  }
  detectZhVoice();
  try {
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = detectZhVoice;
    }
  } catch (e) {
    console.debug('audio.js: onvoiceschanged attach failed:', e);
  }
}

function isTtsAvailable() {
  return ttsAvailable;
}

/* ===== speak(char): pronounce a Chinese character =====
 * No cancel() — Chrome's cancel() kills in-flight utterances when speak() is
 * called multiple times (e.g. animation onComplete + user click). Letting the
 * engine queue naturally avoids the "canceled" error entirely.
 * NOTE: Mac Chrome has a known NSSpeechSynthesizer bug where utterances may
 * be queued but never start. Safari works correctly. See README for details. */
function speak(char) {
  if (!soundEnabled) return;
  if (!window.speechSynthesis) return;
  if (!speechUnlocked) return;
  if (!char || typeof char !== 'string') return;

  try {
    try { window.speechSynthesis.resume(); } catch (e0) {}

    const utter = new SpeechSynthesisUtterance(char);
    utter.lang = 'zh-CN';
    utter.volume = 1;
    utter.pitch = 1;
    let rate = 0.8;
    try {
      const stored = localStorage.getItem('shizi:speechRate');
      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 1.5) rate = parsed;
      }
    } catch (e2) {}
    utter.rate = rate;

    if (ttsAvailable) {
      try {
        const voices = window.speechSynthesis.getVoices();
        for (let i = 0; i < voices.length; i++) {
          if (voices[i].lang && voices[i].lang.toLowerCase().indexOf('zh') === 0) {
            utter.voice = voices[i];
            break;
          }
        }
      } catch (e3) {}
    }

    utter.onerror = function (ev) {
      console.warn('audio.js: speak error for', char, ':', ev.error);
    };

    window.speechSynthesis.speak(utter);
  } catch (e) {
    console.warn('audio.js: speak failed:', e);
  }
}

/* ===== Envelope helper (cloned from wuziqi) ===== */
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

function playCorrectSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const freqs = [523, 659, 784];
    const stepSec = 0.100;
    const now = ctx.currentTime;
    for (let i = 0; i < freqs.length; i++) {
      playTone(freqs[i], now + i * stepSec, 0.010, 0.060, 0.080, 0.12, 'sine');
    }
  } catch (e) {
    console.debug('audio.js: playCorrectSound failed:', e);
  }
}

function playWrongSound() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    playTone(400, now, 0.020, 0.080, 0.120, 0.06, 'sine');
    playTone(300, now + 0.120, 0.020, 0.080, 0.120, 0.05, 'sine');
  } catch (e) {
    console.debug('audio.js: playWrongSound failed:', e);
  }
}

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
    const boomStart = now + (melody.length - 1) * noteSec;
    playTone(130, boomStart, 0.020, 0.300, 0.200, 0.18, 'sine');
  } catch (e) {
    console.debug('audio.js: playWinSound failed:', e);
  }
}

function setSoundEnabledInternal(enabled) {
  soundEnabled = !!enabled;
}

function getSoundEnabledInternal() {
  return soundEnabled;
}
