'use strict';

(function () {
  /* ===== Constants ===== */
  var STORAGE_KEY_HINT = 'wuziqi:hintLevel';
  var STORAGE_KEY_SOUND = 'wuziqi:soundEnabled';
  var STORAGE_KEY_BOARD = 'wuziqi:boardSize';
  var HINT_LEVELS = ['OFF', 'SUBTLE', 'FULL'];
  var BOARD_SIZES = [9, 13, 15];
  var DEFAULT_HINT_LEVEL = 'FULL';
  var DEFAULT_SOUND_ENABLED = true;
  var DEFAULT_BOARD_SIZE = 13;
  var HOLD_DURATION_MS = 3000;
  var SHORT_TAP_MS = 1000;
  var TICK_MS = 200;

  /* ===== State ===== */
  var hintLevel = DEFAULT_HINT_LEVEL;
  var soundEnabled = DEFAULT_SOUND_ENABLED;
  var boardSize = DEFAULT_BOARD_SIZE;

  /* ===== DOM refs ===== */
  var babyGateEl = null;
  var holdBtnEl = null;
  var parentPanelEl = null;
  var hintOptionEls = [];
  var soundToggleEl = null;
  var sizeOptionEls = [];

  /* ===== Hold state ===== */
  var holdIntervalId = null;
  var holdStartTime = 0;
  var holdSucceeded = false;

  var initialized = false;

  /* ===== Styles (injected once, scoped under .settings-* / .baby-gate-*) ===== */
  var SETTINGS_CSS = [
    '.settings-overlay {',
    '  position: fixed; inset: 0; z-index: 200;',
    '  display: flex; align-items: center; justify-content: center;',
    '  background: rgba(40, 25, 10, 0.55);',
    '  -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
    '  animation: settings-fade-in 200ms ease-out;',
    '}',
    '.settings-overlay[hidden] { display: none; }',
    '',
    '.settings-card {',
    '  position: relative;',
    '  background: linear-gradient(180deg, #fffaf0 0%, #fff0d0 100%);',
    '  border: 3px solid #ffd97a;',
    '  border-radius: 28px;',
    '  box-shadow: 0 20px 50px rgba(80, 50, 10, 0.4);',
    '  padding: 30px 32px 24px;',
    '  text-align: center;',
    '  max-width: 86vw; max-height: 90vh; overflow-y: auto;',
    '  color: #4a3520;',
    '  animation: settings-pop-in 480ms cubic-bezier(0.34, 1.56, 0.64, 1);',
    '}',
    '',
    '.settings-close-btn {',
    '  position: absolute; top: 10px; right: 14px;',
    '  width: 36px; height: 36px; border-radius: 50%;',
    '  border: none; background: rgba(0, 0, 0, 0.06);',
    '  color: #8a6a4a; font-size: 22px; line-height: 1;',
    '  cursor: pointer; font-family: inherit;',
    '  transition: background 100ms ease;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '.settings-close-btn:active { background: rgba(0, 0, 0, 0.14); }',
    '',
    '.settings-title {',
    '  font-size: 26px; font-weight: 800;',
    '  color: #5a3a1a; margin-bottom: 6px; letter-spacing: 1px;',
    '}',
    '.settings-subtitle {',
    '  font-size: 15px; color: #8a6a4a; margin-bottom: 16px;',
    '}',
    '',
    '.baby-gate-hold-btn {',
    '  width: 168px; height: 168px; border-radius: 50%;',
    '  border: none;',
    '  background: radial-gradient(circle at 50% 38%, #fff5d8 0%, #ffe082 60%, #f5c848 100%);',
    '  color: #5a3a1a; font-size: 76px; font-weight: 800;',
    '  font-family: inherit; margin: 14px auto 10px; display: block;',
    '  box-shadow:',
    '    0 8px 0 #d4a020,',
    '    0 14px 30px rgba(180, 130, 30, 0.4),',
    '    inset 0 3px 6px rgba(255, 255, 255, 0.7);',
    '  transition: transform 80ms ease, box-shadow 80ms ease;',
    '  touch-action: none;',
    '  -webkit-user-select: none; user-select: none;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '.baby-gate-hold-btn:active {',
    '  transform: translateY(4px);',
    '  box-shadow:',
    '    0 4px 0 #d4a020,',
    '    0 8px 16px rgba(180, 130, 30, 0.4),',
    '    inset 0 3px 6px rgba(255, 255, 255, 0.7);',
    '}',
    '.baby-gate-mini-hint {',
    '  font-size: 13px; color: #a8978a; margin-top: 6px;',
    '}',
    '',
    '.settings-section { margin: 18px 0; text-align: left; }',
    '.settings-section-title {',
    '  font-size: 17px; font-weight: 700; color: #5a3a1a; margin-bottom: 10px;',
    '}',
    '.settings-hint-options { display: flex; gap: 8px; margin-bottom: 8px; }',
    '.settings-hint-option {',
    '  flex: 1; min-height: 54px; font-size: 17px; font-weight: 700;',
    '  font-family: inherit; color: #5a3a1a;',
    '  background: #fff8e0; border: 2px solid #e8c878; border-radius: 14px;',
    '  transition: background 120ms ease, border-color 120ms ease,',
    '    transform 120ms ease, box-shadow 120ms ease;',
    '  cursor: pointer; -webkit-tap-highlight-color: transparent;',
    '}',
    '.settings-hint-option.selected {',
    '  background: linear-gradient(180deg, #ffd97a 0%, #ffc94a 100%);',
    '  border-color: #c9933e; color: #5a3a1a;',
    '  box-shadow: 0 4px 10px rgba(200, 140, 30, 0.3);',
    '  transform: translateY(-1px);',
    '}',
    '.settings-section-desc {',
    '  font-size: 12px; color: #8a6a4a; line-height: 1.55; margin-top: 2px;',
    '}',
    '',
    '.settings-toggle-row {',
    '  display: flex; align-items: center; justify-content: space-between;',
    '  padding: 6px 4px;',
    '}',
    '.settings-toggle-label {',
    '  font-size: 17px; font-weight: 700; color: #5a3a1a;',
    '}',
    '.settings-toggle-switch {',
    '  width: 64px; height: 36px; border-radius: 18px;',
    '  border: none; background: #d0c0a8;',
    '  position: relative; cursor: pointer; padding: 0;',
    '  transition: background 150ms ease;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '.settings-toggle-switch[aria-checked="true"] {',
    '  background: linear-gradient(180deg, #ffd97a 0%, #f5b820 100%);',
    '}',
    '.settings-toggle-knob {',
    '  position: absolute; top: 3px; left: 3px;',
    '  width: 30px; height: 30px; border-radius: 50%;',
    '  background: #fff;',
    '  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);',
    '  transition: transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1);',
    '  pointer-events: none;',
    '}',
    '.settings-toggle-switch[aria-checked="true"] .settings-toggle-knob {',
    '  transform: translateX(28px);',
    '}',
    '',
    '.settings-done-btn {',
    '  display: block; margin: 24px auto 4px;',
    '  min-height: 56px; min-width: 160px; padding: 0 28px;',
    '  font-size: 22px; font-weight: 700; color: #fff;',
    '  background: linear-gradient(180deg, #ffb04a 0%, #ff8c1a 100%);',
    '  border: none; border-radius: 18px;',
    '  box-shadow: 0 5px 0 #c96b00, 0 8px 18px rgba(200, 110, 0, 0.3);',
    '  font-family: inherit;',
    '  transition: transform 80ms ease, box-shadow 80ms ease;',
    '}',
    '.settings-done-btn:active {',
    '  transform: translateY(3px);',
    '  box-shadow: 0 2px 0 #c96b00, 0 4px 10px rgba(200, 110, 0, 0.3);',
    '}',
    '',
    '@keyframes settings-fade-in { from { opacity: 0; } to { opacity: 1; } }',
    '@keyframes settings-pop-in {',
    '  0% { transform: scale(0.6); opacity: 0; }',
    '  60% { transform: scale(1.05); opacity: 1; }',
    '  100% { transform: scale(1); opacity: 1; }',
    '}'
  ].join('\n');

  /* ===== Persistence ===== */
  function loadSettings() {
    try {
      var rawHint = localStorage.getItem(STORAGE_KEY_HINT);
      if (rawHint === 'OFF' || rawHint === 'SUBTLE' || rawHint === 'FULL') {
        hintLevel = rawHint;
      } else {
        hintLevel = DEFAULT_HINT_LEVEL;
      }
    } catch (e) {
      hintLevel = DEFAULT_HINT_LEVEL;
    }
    try {
      var rawSound = localStorage.getItem(STORAGE_KEY_SOUND);
      if (rawSound === 'false') {
        soundEnabled = false;
      } else if (rawSound === 'true') {
        soundEnabled = true;
      } else {
        soundEnabled = DEFAULT_SOUND_ENABLED;
      }
    } catch (e2) {
      soundEnabled = DEFAULT_SOUND_ENABLED;
    }
    try {
      var rawBoard = localStorage.getItem(STORAGE_KEY_BOARD);
      var parsedBoard = parseInt(rawBoard, 10);
      if (BOARD_SIZES.indexOf(parsedBoard) !== -1) {
        boardSize = parsedBoard;
      } else {
        boardSize = DEFAULT_BOARD_SIZE;
      }
    } catch (e3) {
      boardSize = DEFAULT_BOARD_SIZE;
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY_HINT, hintLevel);
      localStorage.setItem(STORAGE_KEY_SOUND, soundEnabled ? 'true' : 'false');
      localStorage.setItem(STORAGE_KEY_BOARD, String(boardSize));
    } catch (e) {
      /* ignore quota / privacy-mode errors */
    }
  }

  /* ===== Getters (canonical read path for other modules) ===== */
  function getHintLevel() {
    return hintLevel;
  }
  function getSoundEnabled() {
    return soundEnabled;
  }
  function getBoardSize() {
    return boardSize;
  }

  /* ===== Setters (canonical write path, called by panel UI) ===== */
  function setHintLevel(level) {
    if (HINT_LEVELS.indexOf(level) === -1) return false;
    hintLevel = level;
    saveSettings();
    syncHintOptionUI();
    applyHintToExternalModule();
    return true;
  }

  function setSoundEnabled(enabled) {
    soundEnabled = enabled ? true : false;
    saveSettings();
    syncSoundToggleUI();
    applySoundToExternalModule();
    return true;
  }

  function setBoardSize(size) {
    if (BOARD_SIZES.indexOf(size) === -1) return false;
    if (boardSize === size) return true;
    boardSize = size;
    saveSettings();
    window.dispatchEvent(new CustomEvent('wuziqi:boardSizeChanged', { detail: { size: boardSize } }));
    return true;
  }

  /* ===== Cross-module delegation =====
   * hint.js / audio.js expose uniquely-named internal hooks
   * (window.setHintLevelInternal / window.setSoundEnabledInternal) to
   * avoid clashing with our canonical user-facing setters. We delegate
   * to those hooks whenever they are present. */
  function applyHintToExternalModule() {
    var external = window.setHintLevelInternal;
    if (typeof external === 'function') {
      try { external(hintLevel); } catch (e) { /* ignore */ }
    }
  }

  function applySoundToExternalModule() {
    var external = window.setSoundEnabledInternal;
    if (typeof external === 'function') {
      try { external(soundEnabled); } catch (e) { /* ignore */ }
    }
  }

  function applySettings() {
    applyHintToExternalModule();
    applySoundToExternalModule();
  }

  /* ===== UI sync ===== */
  function syncHintOptionUI() {
    for (var i = 0; i < hintOptionEls.length; i++) {
      var opt = hintOptionEls[i];
      if (opt.dataset.level === hintLevel) {
        opt.classList.add('selected');
        opt.setAttribute('aria-pressed', 'true');
      } else {
        opt.classList.remove('selected');
        opt.setAttribute('aria-pressed', 'false');
      }
    }
  }

  function syncSoundToggleUI() {
    if (!soundToggleEl) return;
    soundToggleEl.setAttribute('aria-checked', soundEnabled ? 'true' : 'false');
  }

  function syncSizeOptionUI() {
    for (var i = 0; i < sizeOptionEls.length; i++) {
      var opt = sizeOptionEls[i];
      var match = (parseInt(opt.dataset.size, 10) === boardSize);
      if (match) {
        opt.classList.add('selected');
        opt.setAttribute('aria-pressed', 'true');
      } else {
        opt.classList.remove('selected');
        opt.setAttribute('aria-pressed', 'false');
      }
    }
  }

  /* ===== Style injection ===== */
  function injectStyles() {
    if (document.getElementById('wuziqi-settings-styles')) return;
    var style = document.createElement('style');
    style.id = 'wuziqi-settings-styles';
    style.textContent = SETTINGS_CSS;
    document.head.appendChild(style);
  }

  /* ===== DOM helpers ===== */
  function makeEl(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  /* ===== DOM build: baby gate ===== */
  function buildBabyGate() {
    babyGateEl = makeEl('div', 'settings-overlay settings-baby-gate');
    babyGateEl.hidden = true;
    babyGateEl.setAttribute('role', 'dialog');
    babyGateEl.setAttribute('aria-modal', 'true');
    babyGateEl.setAttribute('aria-label', '家长入口');

    var card = makeEl('div', 'settings-card settings-baby-gate-card');

    var closeBtn = makeEl('button', 'settings-close-btn', '\u00d7');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', '关闭');
    closeBtn.addEventListener('click', function () { closeBabyGate(); });
    card.appendChild(closeBtn);

    card.appendChild(makeEl('h2', 'settings-title', '家长入口'));
    card.appendChild(makeEl('p', 'settings-subtitle', '按住下方圆钮 3 秒进入'));

    holdBtnEl = makeEl('button', 'baby-gate-hold-btn', '3');
    holdBtnEl.type = 'button';
    holdBtnEl.setAttribute('aria-label', '按住 3 秒进入家长设置');
    holdBtnEl.addEventListener('pointerdown', startHold);
    holdBtnEl.addEventListener('pointerup', onHoldEnd);
    holdBtnEl.addEventListener('pointerleave', onHoldEnd);
    holdBtnEl.addEventListener('pointercancel', onHoldEnd);
    holdBtnEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    card.appendChild(holdBtnEl);

    card.appendChild(makeEl('p', 'baby-gate-mini-hint', '宝宝看不懂，请家长操作～'));

    babyGateEl.appendChild(card);
    babyGateEl.addEventListener('click', function (e) {
      if (e.target === babyGateEl) closeBabyGate();
    });
    document.body.appendChild(babyGateEl);
  }

  /* ===== DOM build: parent panel ===== */
  function buildParentPanel() {
    parentPanelEl = makeEl('div', 'settings-overlay settings-parent-panel');
    parentPanelEl.hidden = true;
    parentPanelEl.setAttribute('role', 'dialog');
    parentPanelEl.setAttribute('aria-modal', 'true');
    parentPanelEl.setAttribute('aria-label', '家长设置');

    var card = makeEl('div', 'settings-card settings-parent-card');

    var closeBtn = makeEl('button', 'settings-close-btn', '\u00d7');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', '关闭');
    closeBtn.addEventListener('click', function () { closeParentPanel(); });
    card.appendChild(closeBtn);

    card.appendChild(makeEl('h2', 'settings-title', '家长设置'));

    /* Hint level section */
    var hintSection = makeEl('section', 'settings-section');
    hintSection.appendChild(makeEl('h3', 'settings-section-title', '连线提示'));
    var hintRow = makeEl('div', 'settings-hint-options');
    var levels = [
      { key: 'OFF', label: '关闭' },
      { key: 'SUBTLE', label: '轻柔' },
      { key: 'FULL', label: '完整' }
    ];
    hintOptionEls = [];
    levels.forEach(function (lv) {
      var btn = makeEl('button', 'settings-hint-option', lv.label);
      btn.type = 'button';
      btn.dataset.level = lv.key;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', function () { setHintLevel(lv.key); });
      hintRow.appendChild(btn);
      hintOptionEls.push(btn);
    });
    hintSection.appendChild(hintRow);
    var desc = makeEl('p', 'settings-section-desc');
    desc.innerHTML = '完整：连线 + 计数 + 音效<br>轻柔：仅微微闪光<br>关闭：无任何提示';
    hintSection.appendChild(desc);
    card.appendChild(hintSection);

    /* Board size section */
    var boardSection = makeEl('section', 'settings-section');
    boardSection.appendChild(makeEl('h3', 'settings-section-title', '棋盘大小'));
    var sizeRow = makeEl('div', 'settings-hint-options');
    var sizes = [
      { key: 9, label: '9 × 9' },
      { key: 13, label: '13 × 13' },
      { key: 15, label: '15 × 15' }
    ];
    sizeOptionEls = [];
    sizes.forEach(function (s) {
      var btn = makeEl('button', 'settings-hint-option', s.label);
      btn.type = 'button';
      btn.dataset.size = String(s.key);
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', function () {
        setBoardSize(s.key);
        syncSizeOptionUI();
      });
      sizeRow.appendChild(btn);
      sizeOptionEls.push(btn);
    });
    boardSection.appendChild(sizeRow);
    boardSection.appendChild(makeEl('p', 'settings-section-desc', '切换大小会立即重置当前棋局'));
    card.appendChild(boardSection);

    /* Sound toggle section */
    var soundSection = makeEl('section', 'settings-section');
    soundSection.appendChild(makeEl('h3', 'settings-section-title', '游戏音效'));
    var toggleRow = makeEl('div', 'settings-toggle-row');
    toggleRow.appendChild(makeEl('span', 'settings-toggle-label', '音效'));
    soundToggleEl = makeEl('button', 'settings-toggle-switch');
    soundToggleEl.type = 'button';
    soundToggleEl.setAttribute('role', 'switch');
    soundToggleEl.setAttribute('aria-checked', 'true');
    soundToggleEl.appendChild(makeEl('span', 'settings-toggle-knob'));
    soundToggleEl.addEventListener('click', function () {
      setSoundEnabled(!soundEnabled);
    });
    toggleRow.appendChild(soundToggleEl);
    soundSection.appendChild(toggleRow);
    card.appendChild(soundSection);

    /* Done button */
    var doneBtn = makeEl('button', 'settings-done-btn', '完成');
    doneBtn.type = 'button';
    doneBtn.addEventListener('click', function () { closeParentPanel(); });
    card.appendChild(doneBtn);

    parentPanelEl.appendChild(card);
    parentPanelEl.addEventListener('click', function (e) {
      if (e.target === parentPanelEl) closeParentPanel();
    });
    document.body.appendChild(parentPanelEl);
  }

  /* ===== Show / hide ===== */
  function openBabyGate() {
    if (!babyGateEl) return;
    resetHoldButton();
    babyGateEl.hidden = false;
  }

  function closeBabyGate() {
    if (!babyGateEl) return;
    cancelHold();
    holdStartTime = 0;
    holdSucceeded = false;
    if (holdBtnEl) holdBtnEl.textContent = '3';
    babyGateEl.hidden = true;
  }

  function openParentPanel() {
    if (!parentPanelEl) return;
    syncHintOptionUI();
    syncSoundToggleUI();
    syncSizeOptionUI();
    parentPanelEl.hidden = false;
  }

  function closeParentPanel() {
    if (!parentPanelEl) return;
    parentPanelEl.hidden = true;
  }

  /* ===== Hold logic ===== */
  function resetHoldButton() {
    holdSucceeded = false;
    holdStartTime = 0;
    cancelHold();
    if (holdBtnEl) holdBtnEl.textContent = '3';
  }

  function startHold(e) {
    if (e && e.cancelable) e.preventDefault();
    if (holdSucceeded) return;
    if (holdIntervalId !== null) return;
    holdStartTime = Date.now();
    if (holdBtnEl) holdBtnEl.textContent = '3';
    holdIntervalId = window.setInterval(tickHold, TICK_MS);
    tickHold();
  }

  function tickHold() {
    if (holdSucceeded) return;
    var elapsed = Date.now() - holdStartTime;
    var remaining = Math.ceil((HOLD_DURATION_MS - elapsed) / 1000);
    if (remaining <= 0) {
      holdSucceeded = true;
      cancelHold();
      if (holdBtnEl) holdBtnEl.textContent = '\u2713';
      window.setTimeout(function () {
        closeBabyGate();
        openParentPanel();
      }, 250);
    } else {
      if (holdBtnEl) holdBtnEl.textContent = String(remaining);
    }
  }

  function cancelHold() {
    if (holdIntervalId !== null) {
      window.clearInterval(holdIntervalId);
      holdIntervalId = null;
    }
  }

  function onHoldEnd(e) {
    if (e && e.cancelable) e.preventDefault();
    if (holdSucceeded) return;
    var elapsed = holdStartTime ? (Date.now() - holdStartTime) : 0;
    cancelHold();
    holdStartTime = 0;
    if (holdBtnEl) holdBtnEl.textContent = '3';
    /* Short tap (< 1s) closes the gate — matches spec "短按不进入". */
    if (elapsed > 0 && elapsed < SHORT_TAP_MS) {
      closeBabyGate();
    }
    /* Mid-release (>= 1s, < 3s): reset countdown, gate stays open. */
  }

  /* ===== Wire settings button + ESC ===== */
  function wireSettingsButton() {
    var btn = document.querySelector('.settings-btn');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openBabyGate();
    });
  }

  function wireGlobalKeyHandler() {
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (parentPanelEl && !parentPanelEl.hidden) {
        closeParentPanel();
      } else if (babyGateEl && !babyGateEl.hidden) {
        closeBabyGate();
      }
    });
  }

  /* ===== Init ===== */
  function initSettings() {
    if (initialized) return;
    initialized = true;
    injectStyles();
    buildBabyGate();
    buildParentPanel();
    wireSettingsButton();
    wireGlobalKeyHandler();
    loadSettings();
    syncHintOptionUI();
    syncSoundToggleUI();
    applySettings();
  }

  /* ===== Expose canonical globals ===== */
  window.initSettings = initSettings;
  window.getHintLevel = getHintLevel;
  window.setHintLevel = setHintLevel;
  window.getSoundEnabled = getSoundEnabled;
  window.setSoundEnabled = setSoundEnabled;
  window.getBoardSize = getBoardSize;
  window.setBoardSize = setBoardSize;
  window.applySettings = applySettings;

  /* ===== Auto-init on DOMContentLoaded (idempotent) ===== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettings);
  } else {
    initSettings();
  }
})();
