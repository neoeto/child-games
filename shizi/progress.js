'use strict';

/* ===== progress.js — localStorage-backed learning progress for 识字乐园 =====
 *
 * Pure logic module (no DOM manipulation). All state in-memory + persisted to
 * localStorage key "shizi:progress" as a single JSON blob.
 *
 * Globals exposed:
 *   initProgress()                 — call once on DOMContentLoaded; loads + updateStreak
 *   getProgress()                  — returns in-memory progress object
 *   getUnlockedLevel()             — returns number 1-10
 *   getWordProgress(wordId)        — returns {stars, listenCorrect, parentConfirmed, inErrorBook, lastSeen}
 *   recordParentConfirmed(wordId)  — parent clicked "✅会了"
 *   recordListenCorrect(wordId)    — listen quiz correct (stars thresholds: 1 correct→2*, 3 correct→3*)
 *   addToErrorBook(wordId)         — adds to errorBook array
 *   checkLevelUnlock()             — checks 60% threshold, returns {unlocked, newLevel}
 *   updateStreak()                 — updates streak based on lastPlayDate vs today
 *   resetProgress()                — wipes localStorage, resets to DEFAULT_PROGRESS
 *   getErrorBook() / getStickers() / getStreak() / getStats()
 */

(function () {
  var STORAGE_KEY = 'shizi:progress';
  var SCHEMA_VERSION = 1;
  var LEVEL_COUNT = 10;
  var WORDS_PER_LEVEL = 10;
  var UNLOCK_THRESHOLD = 0.6; // 60% of words at stars>=2 unlocks next level

  function todayStr() {
    try {
      return new Date().toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  }

  function dayDiff(dateStrA, dateStrB) {
    if (!dateStrA || !dateStrB) return Infinity;
    try {
      var a = new Date(dateStrA);
      var b = new Date(dateStrB);
      return Math.floor((b - a) / (1000 * 60 * 60 * 24));
    } catch (e) {
      return Infinity;
    }
  }

  function defaultWordProgress() {
    return { stars: 0, listenCorrect: 0, parentConfirmed: false, inErrorBook: false, lastSeen: null };
  }

  function makeDefaultProgress() {
    return {
      version: SCHEMA_VERSION,
      unlockedLevel: 1,
      words: {},
      errorBook: [],
      stickers: { days7: 0, days30: 0, levelClear: [] },
      streak: { current: 0, longest: 0, lastPlayDate: null },
      stats: { totalStars: 0, totalPlayDays: 0, firstPlayDate: null }
    };
  }

  /* ===== In-memory state ===== */
  var progress = makeDefaultProgress();
  var initialized = false;

  /* ===== Persistence ===== */
  function loadProgressFromStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        progress = makeDefaultProgress();
        return;
      }
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || parsed.version !== SCHEMA_VERSION) {
        // Unknown version or corrupt — start fresh (future: migrate)
        progress = makeDefaultProgress();
        return;
      }
      // Defensive: ensure all fields exist
      if (typeof parsed.words !== 'object' || parsed.words === null) parsed.words = {};
      if (!Array.isArray(parsed.errorBook)) parsed.errorBook = [];
      if (typeof parsed.stickers !== 'object' || parsed.stickers === null) {
        parsed.stickers = { days7: 0, days30: 0, levelClear: [] };
      }
      if (typeof parsed.streak !== 'object' || parsed.streak === null) {
        parsed.streak = { current: 0, longest: 0, lastPlayDate: null };
      }
      if (typeof parsed.stats !== 'object' || parsed.stats === null) {
        parsed.stats = { totalStars: 0, totalPlayDays: 0, firstPlayDate: null };
      }
      progress = parsed;
    } catch (e) {
      console.warn('progress.js: loadProgress failed, using defaults:', e);
      progress = makeDefaultProgress();
    }
  }

  function saveProgress() {
    try {
      // Recompute totalStars from words
      var total = 0;
      var keys = Object.keys(progress.words);
      for (var i = 0; i < keys.length; i++) {
        var w = progress.words[keys[i]];
        if (w && typeof w.stars === 'number') total += w.stars;
      }
      progress.stats.totalStars = total;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.warn('progress.js: saveProgress failed (quota? privacy mode?):', e);
    }
  }

  /* ===== Getters ===== */
  function getProgress() { return progress; }

  function getUnlockedLevel() {
    return typeof progress.unlockedLevel === 'number' ? progress.unlockedLevel : 1;
  }

  function getWordProgress(wordId) {
    if (!wordId) return defaultWordProgress();
    var w = progress.words[wordId];
    if (!w) return defaultWordProgress();
    return {
      stars: w.stars || 0,
      listenCorrect: w.listenCorrect || 0,
      parentConfirmed: !!w.parentConfirmed,
      inErrorBook: !!w.inErrorBook,
      lastSeen: w.lastSeen || null
    };
  }

  function getErrorBook() { return progress.errorBook || []; }
  function getStickers() { return progress.stickers; }
  function getStreak() { return progress.streak; }
  function getStats() { return progress.stats; }

  /* ===== Mutators (each calls saveProgress immediately) ===== */
  function ensureWord(wordId) {
    if (!progress.words[wordId]) {
      progress.words[wordId] = defaultWordProgress();
    }
    return progress.words[wordId];
  }

  function recordParentConfirmed(wordId) {
    var w = ensureWord(wordId);
    w.parentConfirmed = true;
    if (w.stars < 1) w.stars = 1;
    w.lastSeen = todayStr();
    saveProgress();
  }

  function recordListenCorrect(wordId) {
    var w = ensureWord(wordId);
    w.listenCorrect = (w.listenCorrect || 0) + 1;
    // Star thresholds: 1 correct → 2 stars, 3 correct → 3 stars
    if (w.listenCorrect >= 3) {
      w.stars = 3;
      // Remove from error book if mastered
      if (w.inErrorBook) {
        w.inErrorBook = false;
        removeFromErrorBookArray(wordId);
      }
    } else if (w.listenCorrect >= 1) {
      if (w.stars < 2) w.stars = 2;
    }
    w.lastSeen = todayStr();
    saveProgress();
  }

  function addToErrorBook(wordId) {
    var w = ensureWord(wordId);
    w.inErrorBook = true;
    w.lastSeen = todayStr();
    // Add to array if not present (most recent at front is optional; we just dedupe)
    if (progress.errorBook.indexOf(wordId) === -1) {
      progress.errorBook.push(wordId);
    }
    saveProgress();
  }

  function removeFromErrorBookArray(wordId) {
    var idx = progress.errorBook.indexOf(wordId);
    if (idx !== -1) progress.errorBook.splice(idx, 1);
  }

  /* ===== Level unlock check (60% of words at stars>=2 in the highest unlocked level) ===== */
  function checkLevelUnlock() {
    var currentLevel = getUnlockedLevel();
    if (currentLevel >= LEVEL_COUNT) return { unlocked: false, newLevel: currentLevel };

    // Count words in current level with stars >= 2
    if (!window.WORDS_BY_LEVEL || !window.WORDS_BY_LEVEL[currentLevel]) {
      return { unlocked: false, newLevel: currentLevel };
    }
    var levelWords = window.WORDS_BY_LEVEL[currentLevel];
    var masteredCount = 0;
    for (var i = 0; i < levelWords.length; i++) {
      var wp = getWordProgress(levelWords[i].id);
      if (wp.stars >= 2) masteredCount++;
    }
    var ratio = masteredCount / levelWords.length;
    if (ratio >= UNLOCK_THRESHOLD) {
      var newLevel = currentLevel + 1;
      progress.unlockedLevel = newLevel;
      // Add level-clear sticker if first time
      if (progress.stickers.levelClear.indexOf(currentLevel) === -1) {
        progress.stickers.levelClear.push(currentLevel);
      }
      saveProgress();
      return { unlocked: true, newLevel: newLevel };
    }
    return { unlocked: false, newLevel: currentLevel };
  }

  /* ===== Streak update (call on game start) ===== */
  function updateStreak() {
    var today = todayStr();
    if (!today) return;
    var last = progress.streak.lastPlayDate;
    var firstEver = !progress.stats.firstPlayDate;

    if (firstEver) {
      progress.stats.firstPlayDate = today;
      progress.stats.totalPlayDays = 1;
    }

    if (last === today) {
      // Already played today — no change
      saveProgress();
      return;
    }

    var diff = dayDiff(last, today);
    if (diff === 1) {
      // Consecutive day
      progress.streak.current = (progress.streak.current || 0) + 1;
    } else if (diff > 1) {
      // Streak broken
      progress.streak.current = 1;
    } else {
      // diff <= 0 (shouldn't happen) or first ever
      progress.streak.current = Math.max(1, (progress.streak.current || 0) + 1);
    }

    if (progress.streak.current > (progress.streak.longest || 0)) {
      progress.streak.longest = progress.streak.current;
    }
    progress.streak.lastPlayDate = today;
    progress.stats.totalPlayDays = (progress.stats.totalPlayDays || 0) + 1;

    // Award 7-day sticker every 7 consecutive days
    if (progress.streak.current > 0 && progress.streak.current % 7 === 0) {
      progress.stickers.days7 = (progress.stickers.days7 || 0) + 1;
    }
    // Award 30-day sticker every 30 consecutive days
    if (progress.streak.current > 0 && progress.streak.current % 30 === 0) {
      progress.stickers.days30 = (progress.stickers.days30 || 0) + 1;
    }
    saveProgress();
  }

  /* ===== Reset ===== */
  function resetProgress() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    progress = makeDefaultProgress();
  }

  /* ===== Init ===== */
  function initProgress() {
    if (initialized) return;
    initialized = true;
    loadProgressFromStorage();
    updateStreak();
  }

  /* ===== Expose ===== */
  window.initProgress = initProgress;
  window.getProgress = getProgress;
  window.getUnlockedLevel = getUnlockedLevel;
  window.getWordProgress = getWordProgress;
  window.recordParentConfirmed = recordParentConfirmed;
  window.recordListenCorrect = recordListenCorrect;
  window.addToErrorBook = addToErrorBook;
  window.checkLevelUnlock = checkLevelUnlock;
  window.updateStreak = updateStreak;
  window.resetProgress = resetProgress;
  window.getErrorBook = getErrorBook;
  window.getStickers = getStickers;
  window.getStreak = getStreak;
  window.getStats = getStats;

  /* ===== Auto-init on DOMContentLoaded ===== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProgress);
  } else {
    initProgress();
  }
})();
