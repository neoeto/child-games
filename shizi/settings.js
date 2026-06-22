'use strict';

/* ===== settings.js — parent controls + baby-gate for 识字乐园 =====
 *
 * Cloned pattern from wuziqi/settings.js, adapted for shizi:
 *   - Sound toggle (shizi:soundEnabled)
 *   - TTS rate slider (shizi:speechRate, 0.5-1.5, default 0.8)
 *   - Stroke speed slider (shizi:strokeSpeed, 0.5-2.0, default 1.2)
 *   - Reset progress button (calls progress.resetProgress)
 *
 * Globals exposed:
 *   initSettings()                          — call once on DOMContentLoaded
 *   getSoundEnabled() / setSoundEnabled(b)
 *   getSpeechRate() / setSpeechRate(0.5-1.5)
 *   getStrokeSpeed() / setStrokeSpeed(0.5-2.0)
 */

(function () {
  var STORAGE_KEY_SOUND = 'shizi:soundEnabled';
  var STORAGE_KEY_SPEECH_RATE = 'shizi:speechRate';
  var STORAGE_KEY_STROKE_SPEED = 'shizi:strokeSpeed';
  var DEFAULT_SOUND_ENABLED = true;
  var DEFAULT_SPEECH_RATE = 0.8;
  var DEFAULT_STROKE_SPEED = 1.2;
  var HOLD_DURATION_MS = 3000;
  var SHORT_TAP_MS = 1000;
  var TICK_MS = 200;

  /* ===== State ===== */
  var soundEnabled = DEFAULT_SOUND_ENABLED;
  var speechRate = DEFAULT_SPEECH_RATE;
  var strokeSpeed = DEFAULT_STROKE_SPEED;

  var babyGateEl = null;
  var holdBtnEl = null;
  var parentPanelEl = null;
  var soundToggleEl = null;
  var speechRateInput = null;
  var speechRateLabel = null;
  var strokeSpeedInput = null;
  var strokeSpeedLabel = null;

  var holdIntervalId = null;
  var holdStartTime = 0;
  var holdSucceeded = false;
  var initialized = false;

  /* ===== CSS (scoped, injected once) ===== */
  var SETTINGS_CSS = [
    '.shizi-settings-overlay {',
    '  position: fixed; inset: 0; z-index: 200;',
    '  display: flex; align-items: center; justify-content: center;',
    '  background: rgba(40, 25, 10, 0.55);',
    '  -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
    '  animation: shizi-settings-fade-in 200ms ease-out;',
    '}',
    '.shizi-settings-overlay[hidden] { display: none; }',
    '',
    '.shizi-settings-card {',
    '  position: relative;',
    '  background: linear-gradient(180deg, #fffaf0 0%, #fff0d0 100%);',
    '  border: 3px solid #ffd97a;',
    '  border-radius: 28px;',
    '  box-shadow: 0 20px 50px rgba(80, 50, 10, 0.4);',
    '  padding: 30px 32px 24px;',
    '  text-align: center;',
    '  max-width: 86vw; max-height: 90vh; overflow-y: auto;',
    '  color: #4a3520;',
    '  animation: shizi-settings-pop-in 480ms cubic-bezier(0.34, 1.56, 0.64, 1);',
    '}',
    '.shizi-settings-close-btn {',
    '  position: absolute; top: 10px; right: 14px;',
    '  width: 36px; height: 36px; border-radius: 50%;',
    '  border: none; background: rgba(0, 0, 0, 0.06);',
    '  color: #8a6a4a; font-size: 22px; line-height: 1;',
    '  cursor: pointer; font-family: inherit;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '.shizi-settings-close-btn:active { background: rgba(0, 0, 0, 0.14); }',
    '',
    '.shizi-settings-title {',
    '  font-size: 26px; font-weight: 800;',
    '  color: #5a3a1a; margin-bottom: 6px; letter-spacing: 1px;',
    '}',
    '.shizi-settings-subtitle {',
    '  font-size: 15px; color: #8a6a4a; margin-bottom: 16px;',
    '}',
    '',
    '.shizi-baby-gate-hold-btn {',
    '  width: 168px; height: 168px; border-radius: 50%;',
    '  border: none;',
    '  background: radial-gradient(circle at 50% 38%, #fff5d8 0%, #ffe082 60%, #f5c848 100%);',
    '  color: #5a3a1a; font-size: 76px; font-weight: 800;',
    '  font-family: inherit; margin: 14px auto 10px; display: block;',
    '  box-shadow: 0 8px 0 #d4a020, 0 14px 30px rgba(180, 130, 30, 0.4), inset 0 3px 6px rgba(255, 255, 255, 0.7);',
    '  transition: transform 80ms ease, box-shadow 80ms ease;',
    '  touch-action: none;',
    '  -webkit-user-select: none; user-select: none;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '.shizi-baby-gate-hold-btn:active {',
    '  transform: translateY(4px);',
    '  box-shadow: 0 4px 0 #d4a020, 0 8px 16px rgba(180, 130, 30, 0.4), inset 0 3px 6px rgba(255, 255, 255, 0.7);',
    '}',
    '.shizi-baby-gate-mini-hint { font-size: 13px; color: #a8978a; margin-top: 6px; }',
    '',
    '.shizi-settings-section { margin: 18px 0; text-align: left; }',
    '.shizi-settings-section-title {',
    '  font-size: 17px; font-weight: 700; color: #5a3a1a; margin-bottom: 10px;',
    '}',
    '.shizi-settings-section-desc {',
    '  font-size: 12px; color: #8a6a4a; line-height: 1.55; margin-top: 2px;',
    '}',
    '',
    '.shizi-settings-toggle-row {',
    '  display: flex; align-items: center; justify-content: space-between;',
    '  padding: 6px 4px;',
    '}',
    '.shizi-settings-toggle-label { font-size: 17px; font-weight: 700; color: #5a3a1a; }',
    '.shizi-settings-toggle-switch {',
    '  width: 64px; height: 36px; border-radius: 18px;',
    '  border: none; background: #d0c0a8;',
    '  position: relative; cursor: pointer; padding: 0;',
    '  transition: background 150ms ease;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '.shizi-settings-toggle-switch[aria-checked="true"] {',
    '  background: linear-gradient(180deg, #ffd97a 0%, #f5b820 100%);',
    '}',
    '.shizi-settings-toggle-knob {',
    '  position: absolute; top: 3px; left: 3px;',
    '  width: 30px; height: 30px; border-radius: 50%;',
    '  background: #fff;',
    '  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);',
    '  transition: transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1);',
    '  pointer-events: none;',
    '}',
    '.shizi-settings-toggle-switch[aria-checked="true"] .shizi-settings-toggle-knob {',
    '  transform: translateX(28px);',
    '}',
    '',
    '.shizi-settings-slider-row { padding: 6px 4px; }',
    '.shizi-settings-slider-label-row {',
    '  display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;',
    '}',
    '.shizi-settings-slider-value { font-size: 14px; color: #8a6a4a; font-weight: 600; }',
    '.shizi-settings-slider {',
    '  width: 100%; height: 40px;',
    '  -webkit-appearance: none; appearance: none;',
    '  background: transparent; cursor: pointer;',
    '}',
    '.shizi-settings-slider::-webkit-slider-runnable-track {',
    '  height: 8px; border-radius: 4px;',
    '  background: linear-gradient(90deg, #ffd97a 0%, #f5b820 100%);',
    '}',
    '.shizi-settings-slider::-moz-range-track {',
    '  height: 8px; border-radius: 4px;',
    '  background: linear-gradient(90deg, #ffd97a 0%, #f5b820 100%);',
    '}',
    '.shizi-settings-slider::-webkit-slider-thumb {',
    '  -webkit-appearance: none; appearance: none;',
    '  width: 28px; height: 28px; border-radius: 50%;',
    '  background: #fff; border: 2px solid #c9933e; margin-top: -10px;',
    '  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);',
    '}',
    '.shizi-settings-slider::-moz-range-thumb {',
    '  width: 28px; height: 28px; border-radius: 50%;',
    '  background: #fff; border: 2px solid #c9933e;',
    '  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);',
    '}',
    '',
    '.shizi-settings-reset-btn {',
    '  display: block; margin: 20px auto 4px;',
    '  min-height: 50px; min-width: 160px; padding: 0 24px;',
    '  font-size: 18px; font-weight: 700; color: #fff;',
    '  background: linear-gradient(180deg, #f06060 0%, #d03030 100%);',
    '  border: none; border-radius: 14px;',
    '  box-shadow: 0 4px 0 #a02020, 0 6px 14px rgba(160, 30, 30, 0.3);',
    '  font-family: inherit;',
    '  transition: transform 80ms ease;',
    '}',
    '.shizi-settings-reset-btn:active {',
    '  transform: translateY(2px);',
    '}',
    '',
    '.shizi-settings-done-btn {',
    '  display: block; margin: 24px auto 4px;',
    '  min-height: 56px; min-width: 160px; padding: 0 28px;',
    '  font-size: 22px; font-weight: 700; color: #fff;',
    '  background: linear-gradient(180deg, #ffb04a 0%, #ff8c1a 100%);',
    '  border: none; border-radius: 18px;',
    '  box-shadow: 0 5px 0 #c96b00, 0 8px 18px rgba(200, 110, 0, 0.3);',
    '  font-family: inherit;',
    '}',
    '.shizi-settings-done-btn:active { transform: translateY(3px); }',
    '',
    '.shizi-confirm-overlay { z-index: 300; }',
    '.shizi-confirm-card { max-width: 72vw; padding: 26px 28px 20px; }',
    '.shizi-confirm-text { font-size: 17px; color: #5a3a1a; line-height: 1.6; margin-bottom: 20px; }',
    '.shizi-confirm-btns { display: flex; gap: 12px; justify-content: center; }',
    '.shizi-confirm-btn {',
    '  min-height: 50px; min-width: 100px; padding: 0 20px;',
    '  font-size: 18px; font-weight: 700; font-family: inherit;',
    '  border: none; border-radius: 14px; cursor: pointer;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '.shizi-confirm-btn-cancel {',
    '  background: #e0d5c0; color: #5a3a1a;',
    '}',
    '.shizi-confirm-btn-ok {',
    '  background: linear-gradient(180deg, #f06060 0%, #d03030 100%); color: #fff;',
    '  box-shadow: 0 4px 0 #a02020;',
    '}',
    '',
    '@keyframes shizi-settings-fade-in { from { opacity: 0; } to { opacity: 1; } }',
    '@keyframes shizi-settings-pop-in {',
    '  0% { transform: scale(0.6); opacity: 0; }',
    '  60% { transform: scale(1.05); opacity: 1; }',
    '  100% { transform: scale(1); opacity: 1; }',
    '}'
  ].join('\n');

  /* ===== Persistence ===== */
  function loadSettings() {
    try {
      var rawSound = localStorage.getItem(STORAGE_KEY_SOUND);
      if (rawSound === 'false') soundEnabled = false;
      else if (rawSound === 'true') soundEnabled = true;
      else soundEnabled = DEFAULT_SOUND_ENABLED;
    } catch (e) { soundEnabled = DEFAULT_SOUND_ENABLED; }
    try {
      var rawRate = localStorage.getItem(STORAGE_KEY_SPEECH_RATE);
      var parsedRate = parseFloat(rawRate);
      if (!isNaN(parsedRate) && parsedRate >= 0.5 && parsedRate <= 1.5) speechRate = parsedRate;
      else speechRate = DEFAULT_SPEECH_RATE;
    } catch (e2) { speechRate = DEFAULT_SPEECH_RATE; }
    try {
      var rawStroke = localStorage.getItem(STORAGE_KEY_STROKE_SPEED);
      var parsedStroke = parseFloat(rawStroke);
      if (!isNaN(parsedStroke) && parsedStroke >= 0.5 && parsedStroke <= 2.0) strokeSpeed = parsedStroke;
      else strokeSpeed = DEFAULT_STROKE_SPEED;
    } catch (e3) { strokeSpeed = DEFAULT_STROKE_SPEED; }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, soundEnabled ? 'true' : 'false');
      localStorage.setItem(STORAGE_KEY_SPEECH_RATE, String(speechRate));
      localStorage.setItem(STORAGE_KEY_STROKE_SPEED, String(strokeSpeed));
    } catch (e) { /* ignore */ }
  }

  /* ===== Getters ===== */
  function getSoundEnabled() { return soundEnabled; }
  function getSpeechRate() { return speechRate; }
  function getStrokeSpeed() { return strokeSpeed; }

  /* ===== Setters (canonical write path) ===== */
  function setSoundEnabled(enabled) {
    soundEnabled = enabled ? true : false;
    saveSettings();
    syncSoundToggleUI();
    applySoundToExternalModule();
  }

  function setSpeechRate(rate) {
    var r = parseFloat(rate);
    if (isNaN(r)) return;
    if (r < 0.5) r = 0.5;
    if (r > 1.5) r = 1.5;
    speechRate = r;
    saveSettings();
    syncSpeechRateUI();
  }

  function setStrokeSpeed(speed) {
    var s = parseFloat(speed);
    if (isNaN(s)) return;
    if (s < 0.5) s = 0.5;
    if (s > 2.0) s = 2.0;
    strokeSpeed = s;
    saveSettings();
    syncStrokeSpeedUI();
  }

  /* ===== Cross-module delegation ===== */
  function applySoundToExternalModule() {
    if (typeof window.setSoundEnabledInternal === 'function') {
      try { window.setSoundEnabledInternal(soundEnabled); } catch (e) { /* ignore */ }
    }
  }

  function applySettings() { applySoundToExternalModule(); }

  /* ===== UI sync ===== */
  function syncSoundToggleUI() {
    if (soundToggleEl) {
      soundToggleEl.setAttribute('aria-checked', soundEnabled ? 'true' : 'false');
    }
  }

  function rateLabel(r) {
    if (r < 0.7) return '慢';
    if (r > 1.1) return '快';
    return '正常';
  }

  function speedLabel(s) {
    if (s < 0.9) return '慢';
    if (s > 1.4) return '快';
    return '正常';
  }

  function syncSpeechRateUI() {
    if (speechRateInput) speechRateInput.value = String(speechRate);
    if (speechRateLabel) speechRateLabel.textContent = rateLabel(speechRate) + ' (' + speechRate.toFixed(1) + 'x)';
  }

  function syncStrokeSpeedUI() {
    if (strokeSpeedInput) strokeSpeedInput.value = String(strokeSpeed);
    if (strokeSpeedLabel) strokeSpeedLabel.textContent = speedLabel(strokeSpeed) + ' (' + strokeSpeed.toFixed(1) + 'x)';
  }

  /* ===== Style injection ===== */
  function injectStyles() {
    if (document.getElementById('shizi-settings-styles')) return;
    var style = document.createElement('style');
    style.id = 'shizi-settings-styles';
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

  /* ===== Baby gate ===== */
  function buildBabyGate() {
    babyGateEl = makeEl('div', 'shizi-settings-overlay shizi-baby-gate');
    babyGateEl.hidden = true;
    babyGateEl.setAttribute('role', 'dialog');
    babyGateEl.setAttribute('aria-modal', 'true');
    babyGateEl.setAttribute('aria-label', '家长入口');

    var card = makeEl('div', 'shizi-settings-card');
    var closeBtn = makeEl('button', 'shizi-settings-close-btn', '\u00d7');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', '关闭');
    closeBtn.addEventListener('click', function () { closeBabyGate(); });
    card.appendChild(closeBtn);

    card.appendChild(makeEl('h2', 'shizi-settings-title', '家长入口'));
    card.appendChild(makeEl('p', 'shizi-settings-subtitle', '按住下方圆钮 3 秒进入'));

    holdBtnEl = makeEl('button', 'shizi-baby-gate-hold-btn', '3');
    holdBtnEl.type = 'button';
    holdBtnEl.setAttribute('aria-label', '按住 3 秒进入家长设置');
    holdBtnEl.addEventListener('pointerdown', startHold);
    holdBtnEl.addEventListener('pointerup', onHoldEnd);
    holdBtnEl.addEventListener('pointerleave', onHoldEnd);
    holdBtnEl.addEventListener('pointercancel', onHoldEnd);
    holdBtnEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    card.appendChild(holdBtnEl);

    card.appendChild(makeEl('p', 'shizi-baby-gate-mini-hint', '宝宝看不懂，请家长操作～'));

    babyGateEl.appendChild(card);
    babyGateEl.addEventListener('click', function (e) {
      if (e.target === babyGateEl) closeBabyGate();
    });
    document.body.appendChild(babyGateEl);
  }

  /* ===== Parent panel ===== */
  function buildParentPanel() {
    parentPanelEl = makeEl('div', 'shizi-settings-overlay shizi-parent-panel');
    parentPanelEl.hidden = true;
    parentPanelEl.setAttribute('role', 'dialog');
    parentPanelEl.setAttribute('aria-modal', 'true');
    parentPanelEl.setAttribute('aria-label', '家长设置');

    var card = makeEl('div', 'shizi-settings-card');
    var closeBtn = makeEl('button', 'shizi-settings-close-btn', '\u00d7');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', '关闭');
    closeBtn.addEventListener('click', function () { closeParentPanel(); });
    card.appendChild(closeBtn);

    card.appendChild(makeEl('h2', 'shizi-settings-title', '家长设置'));

    // Sound toggle section
    var soundSection = makeEl('section', 'shizi-settings-section');
    soundSection.appendChild(makeEl('h3', 'shizi-settings-section-title', '游戏音效'));
    var toggleRow = makeEl('div', 'shizi-settings-toggle-row');
    toggleRow.appendChild(makeEl('span', 'shizi-settings-toggle-label', '音效与发音'));
    soundToggleEl = makeEl('button', 'shizi-settings-toggle-switch');
    soundToggleEl.type = 'button';
    soundToggleEl.setAttribute('role', 'switch');
    soundToggleEl.setAttribute('aria-checked', 'true');
    soundToggleEl.appendChild(makeEl('span', 'shizi-settings-toggle-knob'));
    soundToggleEl.addEventListener('click', function () { setSoundEnabled(!soundEnabled); });
    toggleRow.appendChild(soundToggleEl);
    soundSection.appendChild(toggleRow);
    card.appendChild(soundSection);

    // Speech rate section
    var rateSection = makeEl('section', 'shizi-settings-section');
    rateSection.appendChild(makeEl('h3', 'shizi-settings-section-title', '发音语速'));
    var rateRow = makeEl('div', 'shizi-settings-slider-row');
    var rateLabelRow = makeEl('div', 'shizi-settings-slider-label-row');
    rateLabelRow.appendChild(makeEl('span', 'shizi-settings-toggle-label', '语速'));
    speechRateLabel = makeEl('span', 'shizi-settings-slider-value', '');
    rateLabelRow.appendChild(speechRateLabel);
    rateRow.appendChild(rateLabelRow);
    speechRateInput = document.createElement('input');
    speechRateInput.type = 'range';
    speechRateInput.className = 'shizi-settings-slider';
    speechRateInput.min = '0.5';
    speechRateInput.max = '1.5';
    speechRateInput.step = '0.1';
    speechRateInput.value = String(speechRate);
    speechRateInput.addEventListener('input', function () { setSpeechRate(speechRateInput.value); });
    rateRow.appendChild(speechRateInput);
    rateSection.appendChild(rateRow);
    rateSection.appendChild(makeEl('p', 'shizi-settings-section-desc', '默认慢速 (0.8x) 适合小朋友听清发音'));
    card.appendChild(rateSection);

    // Stroke speed section
    var strokeSection = makeEl('section', 'shizi-settings-section');
    strokeSection.appendChild(makeEl('h3', 'shizi-settings-section-title', '笔顺播放速度'));
    var strokeRow = makeEl('div', 'shizi-settings-slider-row');
    var strokeLabelRow = makeEl('div', 'shizi-settings-slider-label-row');
    strokeLabelRow.appendChild(makeEl('span', 'shizi-settings-toggle-label', '笔顺速度'));
    strokeSpeedLabel = makeEl('span', 'shizi-settings-slider-value', '');
    strokeLabelRow.appendChild(strokeSpeedLabel);
    strokeRow.appendChild(strokeLabelRow);
    strokeSpeedInput = document.createElement('input');
    strokeSpeedInput.type = 'range';
    strokeSpeedInput.className = 'shizi-settings-slider';
    strokeSpeedInput.min = '0.5';
    strokeSpeedInput.max = '2.0';
    strokeSpeedInput.step = '0.1';
    strokeSpeedInput.value = String(strokeSpeed);
    strokeSpeedInput.addEventListener('input', function () { setStrokeSpeed(strokeSpeedInput.value); });
    strokeRow.appendChild(strokeSpeedInput);
    strokeSection.appendChild(strokeRow);
    strokeSection.appendChild(makeEl('p', 'shizi-settings-section-desc', '亲子认字模式下的笔画动画播放速度'));
    card.appendChild(strokeSection);

    // Reset progress button
    var resetBtn = makeEl('button', 'shizi-settings-reset-btn', '🗑 重置学习进度');
    resetBtn.type = 'button';
    resetBtn.addEventListener('click', showResetConfirm);
    card.appendChild(resetBtn);

    // Done button
    var doneBtn = makeEl('button', 'shizi-settings-done-btn', '完成');
    doneBtn.type = 'button';
    doneBtn.addEventListener('click', function () { closeParentPanel(); });
    card.appendChild(doneBtn);

    parentPanelEl.appendChild(card);
    parentPanelEl.addEventListener('click', function (e) {
      if (e.target === parentPanelEl) closeParentPanel();
    });
    document.body.appendChild(parentPanelEl);
  }

  /* ===== Reset confirmation dialog ===== */
  function showResetConfirm() {
    var overlay = makeEl('div', 'shizi-settings-overlay shizi-confirm-overlay');
    var card = makeEl('div', 'shizi-settings-card shizi-confirm-card');
    card.appendChild(makeEl('h2', 'shizi-settings-title', '确认重置？'));
    card.appendChild(makeEl('p', 'shizi-confirm-text', '这将清空所有学习进度（星星、关卡、错字本、贴纸），且无法恢复。音效与速度设置不受影响。'));
    var btns = makeEl('div', 'shizi-confirm-btns');
    var cancelBtn = makeEl('button', 'shizi-confirm-btn shizi-confirm-btn-cancel', '取消');
    cancelBtn.type = 'button';
    cancelBtn.addEventListener('click', function () { document.body.removeChild(overlay); });
    var okBtn = makeEl('button', 'shizi-confirm-btn shizi-confirm-btn-ok', '确认重置');
    okBtn.type = 'button';
    okBtn.addEventListener('click', function () {
      if (typeof window.resetProgress === 'function') {
        try { window.resetProgress(); } catch (e) { /* ignore */ }
      }
      document.body.removeChild(overlay);
      closeParentPanel();
    });
    btns.appendChild(cancelBtn);
    btns.appendChild(okBtn);
    card.appendChild(btns);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  /* ===== Show / hide ===== */
  function openBabyGate() { if (babyGateEl) { resetHoldButton(); babyGateEl.hidden = false; } }
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
    syncSoundToggleUI();
    syncSpeechRateUI();
    syncStrokeSpeedUI();
    parentPanelEl.hidden = false;
  }
  function closeParentPanel() { if (parentPanelEl) parentPanelEl.hidden = true; }

  /* ===== Hold logic (cloned from wuziqi) ===== */
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
      window.setTimeout(function () { closeBabyGate(); openParentPanel(); }, 250);
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
    if (elapsed > 0 && elapsed < SHORT_TAP_MS) closeBabyGate();
  }

  /* ===== Wire settings button ===== */
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
      if (parentPanelEl && !parentPanelEl.hidden) closeParentPanel();
      else if (babyGateEl && !babyGateEl.hidden) closeBabyGate();
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
    syncSoundToggleUI();
    syncSpeechRateUI();
    syncStrokeSpeedUI();
    applySettings();
  }

  /* ===== Expose ===== */
  window.initSettings = initSettings;
  window.getSoundEnabled = getSoundEnabled;
  window.setSoundEnabled = setSoundEnabled;
  window.getSpeechRate = getSpeechRate;
  window.setSpeechRate = setSpeechRate;
  window.getStrokeSpeed = getStrokeSpeed;
  window.setStrokeSpeed = setStrokeSpeed;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettings);
  } else {
    initSettings();
  }
})();
