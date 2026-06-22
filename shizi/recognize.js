'use strict';

/* ===== recognize.js — parent-child recognition mode (亲子认字) with HanziWriter =====
 *
 * Renders recognition UI into #app. Shows large character card with HanziWriter
 * stroke animation, parent tests child's reading, parent judges 会了/再练.
 *
 * Globals exposed:
 *   startRecognizeMode(level)   — level: number 1-10
 *   exitRecognizeMode()         — cleanup, return to main screen
 */

(function () {
  var appEl = null;
  var currentLevel = 1;
  var currentWordIndex = 0;
  var currentWriter = null;
  var strokeStageEl = null;

  function startRecognizeMode(level) {
    currentLevel = level || 1;
    appEl = document.getElementById('app');
    if (!appEl) return;
    currentWordIndex = 0;
    // Find first unmastered word in level
    currentWordIndex = findNextUnmasteredIndex(-1);
    loadCurrentWord();
  }

  function exitRecognizeMode() {
    cleanupWriter();
    appEl = document.getElementById('app');
    if (appEl) appEl.innerHTML = '';
    if (typeof window.showMainScreen === 'function') {
      try { window.showMainScreen(); } catch (e) { /* ignore */ }
    }
  }

  function cleanupWriter() {
    if (currentWriter) {
      try {
        if (typeof currentWriter.hideCharacter === 'function') currentWriter.hideCharacter();
      } catch (e) { /* ignore */ }
      currentWriter = null;
    }
    if (strokeStageEl) {
      strokeStageEl.innerHTML = '';
    }
  }

  function findNextUnmasteredIndex(fromIndex) {
    if (!window.WORDS_BY_LEVEL || !window.WORDS_BY_LEVEL[currentLevel]) return 0;
    var levelWords = window.WORDS_BY_LEVEL[currentLevel];
    var start = fromIndex + 1;
    for (var i = start; i < levelWords.length; i++) {
      if (!isMastered(levelWords[i].id)) return i;
    }
    // Wrap around: find from beginning
    for (var j = 0; j < start && j < levelWords.length; j++) {
      if (!isMastered(levelWords[j].id)) return j;
    }
    // All mastered — check if ALL are mastered
    var allMastered = true;
    for (var k = 0; k < levelWords.length; k++) {
      if (!isMastered(levelWords[k].id)) { allMastered = false; break; }
    }
    if (allMastered) return -1; // signal all done
    return start % levelWords.length;
  }

  function isMastered(wordId) {
    if (typeof window.getWordProgress !== 'function') return false;
    try {
      var wp = window.getWordProgress(wordId);
      return wp && wp.stars >= 3;
    } catch (e) { return false; }
  }

  function getCurrentWord() {
    if (!window.WORDS_BY_LEVEL || !window.WORDS_BY_LEVEL[currentLevel]) return null;
    if (currentWordIndex < 0) return null;
    return window.WORDS_BY_LEVEL[currentLevel][currentWordIndex];
  }

  function loadCurrentWord() {
    if (currentWordIndex < 0) {
      renderAllMastered();
      return;
    }
    var word = getCurrentWord();
    if (!word) return;
    renderWord(word);
  }

  /* ===== Rendering ===== */
  function renderWord(word) {
    if (!appEl) return;
    cleanupWriter();
    appEl.innerHTML = '';

    // Header
    var header = document.createElement('div');
    header.className = 'shizi-mode-header';
    var backBtn = document.createElement('button');
    backBtn.className = 'shizi-back-btn';
    backBtn.type = 'button';
    backBtn.textContent = '← 返回';
    backBtn.addEventListener('click', function () { exitRecognizeMode(); });
    header.appendChild(backBtn);
    var title = document.createElement('span');
    title.className = 'shizi-mode-title';
    title.textContent = '第' + currentLevel + '关 · 亲子认字';
    header.appendChild(title);
    appEl.appendChild(header);

    // Stroke stage (HanziWriter target)
    strokeStageEl = document.createElement('div');
    strokeStageEl.className = 'shizi-stroke-stage';
    strokeStageEl.id = 'shizi-stroke-stage';
    appEl.appendChild(strokeStageEl);

    // Pinyin hint (if TTS unavailable)
    var ttsOk = typeof window.isTtsAvailable === 'function' ? window.isTtsAvailable() : true;
    if (!ttsOk) {
      var pinyinEl = document.createElement('p');
      pinyinEl.className = 'shizi-pinyin-display';
      pinyinEl.textContent = word.pinyin;
      appEl.appendChild(pinyinEl);
    }

    // Click hint
    var clickHint = document.createElement('p');
    clickHint.className = 'shizi-click-hint';
    clickHint.textContent = '👆 点字听发音';
    appEl.appendChild(clickHint);

    // Control buttons
    var controls = document.createElement('div');
    controls.className = 'shizi-recognize-controls';
    var replayBtn = document.createElement('button');
    replayBtn.className = 'shizi-control-btn';
    replayBtn.type = 'button';
    replayBtn.textContent = '▶️ 重播笔顺';
    replayBtn.addEventListener('click', replayStrokes);
    controls.appendChild(replayBtn);
    var listenBtn = document.createElement('button');
    listenBtn.className = 'shizi-control-btn';
    listenBtn.type = 'button';
    listenBtn.textContent = '🔊 再听发音';
    listenBtn.addEventListener('click', function () {
      if (typeof window.speak === 'function') {
        try { window.speak(word.char); } catch (e) { /* ignore */ }
      }
    });
    controls.appendChild(listenBtn);
    appEl.appendChild(controls);

    // Parent judgment buttons
    var judgeRow = document.createElement('div');
    judgeRow.className = 'shizi-judge-row';
    var yesBtn = document.createElement('button');
    yesBtn.className = 'shizi-judge-btn shizi-judge-yes';
    yesBtn.type = 'button';
    yesBtn.textContent = '✅ 会了';
    yesBtn.addEventListener('click', function () { onParentConfirmed(word); });
    judgeRow.appendChild(yesBtn);
    var noBtn = document.createElement('button');
    noBtn.className = 'shizi-judge-btn shizi-judge-no';
    noBtn.type = 'button';
    noBtn.textContent = '🌱 再练';
    noBtn.addEventListener('click', function () { onParentRetry(word); });
    judgeRow.appendChild(noBtn);
    appEl.appendChild(judgeRow);

    // Tip
    var tipEl = document.createElement('p');
    tipEl.className = 'shizi-tip-text';
    tipEl.textContent = '💡 ' + word.tip;
    appEl.appendChild(tipEl);

    // Progress indicator
    var progress = document.createElement('p');
    progress.className = 'shizi-progress-hint';
    if (typeof window.getStats === 'function') {
      try {
        var stats = window.getStats();
        var totalLearned = 0;
        if (window.WORDS) {
          for (var i = 0; i < window.WORDS.length; i++) {
            var wp = window.getWordProgress(window.WORDS[i].id);
            if (wp && wp.stars > 0) totalLearned++;
          }
        }
        progress.textContent = '已学 ' + totalLearned + '/100 · ⭐' + (stats.totalStars || 0);
      } catch (e) { /* ignore */ }
    }
    appEl.appendChild(progress);

    // Create HanziWriter
    createWriter(word);
  }

  function createWriter(word) {
    if (typeof window.HanziWriter === 'undefined') {
      renderPlainTextFallback(word);
      return;
    }
    // Read stroke speed from settings
    var strokeSpeed = 1.2;
    if (typeof window.getStrokeSpeed === 'function') {
      try { strokeSpeed = window.getStrokeSpeed(); } catch (e) { /* ignore */ }
    }

    try {
      currentWriter = window.HanziWriter.create('shizi-stroke-stage', word.char, {
        width: 280,
        height: 280,
        padding: 20,
        showOutline: true,
        showCharacter: false,
        strokeColor: '#333333',
        outlineColor: '#EEEEEE',
        radicalColor: '#168D16',
        strokeAnimationSpeed: strokeSpeed,
        delayBetweenStrokes: 600,
        charDataLoader: function (char, onLoad, onError) {
          var data = window.HANZI_CHAR_DATA && window.HANZI_CHAR_DATA[char];
          if (data) {
            if (onLoad) onLoad(data);
          } else {
            console.warn('recognize.js: no char data for', char);
            renderPlainTextFallback(word);
            if (onError) onError(new Error('No char data for ' + char));
          }
        }
      });

      if (strokeStageEl) {
        strokeStageEl.addEventListener('click', onStageClick);
      }

      var w = currentWriter;
      var ch = word.char;
      setTimeout(function () {
        if (w !== currentWriter) return;
        if (w && typeof w.animateCharacter === 'function') {
          try {
            w.animateCharacter({
              onComplete: function () {
                if (typeof window.speak === 'function') {
                  try { window.speak(ch); } catch (e) { /* ignore */ }
                }
              }
            });
          } catch (e) {
            console.warn('recognize.js: animateCharacter threw', e);
          }
        }
      }, 50);
    } catch (e) {
      console.warn('recognize.js: HanziWriter.create failed', e);
      renderPlainTextFallback(word);
    }
  }

  function onStageClick() {
    var word = getCurrentWord();
    if (word && typeof window.speak === 'function') {
      try { window.speak(word.char); } catch (e) { /* ignore */ }
    }
    if (typeof window.playPlaceSound === 'function') {
      try { window.playPlaceSound(); } catch (e) { /* ignore */ }
    }
  }

  function renderPlainTextFallback(word) {
    if (!strokeStageEl) return;
    strokeStageEl.innerHTML = '';
    strokeStageEl.classList.add('shizi-plain-fallback');
    var charEl = document.createElement('div');
    charEl.className = 'shizi-plain-char';
    charEl.textContent = word.char;
    charEl.addEventListener('click', onStageClick);
    strokeStageEl.appendChild(charEl);
  }

  function replayStrokes() {
    var word = getCurrentWord();
    if (!word) return;
    if (currentWriter && typeof currentWriter.hideCharacter === 'function' && typeof currentWriter.animateCharacter === 'function') {
      try {
        currentWriter.hideCharacter();
        setTimeout(function () {
          if (currentWriter) {
            try {
              currentWriter.animateCharacter({
                onComplete: function () {
                  if (typeof window.speak === 'function') {
                    try { window.speak(word.char); } catch (e) { /* ignore */ }
                  }
                }
              });
            } catch (e) { /* ignore */ }
          }
        }, 100);
      } catch (e) { /* ignore */ }
    } else {
      // Plain text fallback — just re-speak
      if (typeof window.speak === 'function') {
        try { window.speak(word.char); } catch (e) { /* ignore */ }
      }
    }
  }

  function onParentConfirmed(word) {
    if (typeof window.recordParentConfirmed === 'function') {
      try { window.recordParentConfirmed(word.id); } catch (e) { /* ignore */ }
    }
    if (typeof window.playPlaceSound === 'function') {
      try { window.playPlaceSound(); } catch (e) { /* ignore */ }
    }
    showBriefCheckmark();
    setTimeout(function () {
      currentWordIndex = findNextUnmasteredIndex(currentWordIndex);
      loadCurrentWord();
    }, 500);
  }

  function onParentRetry(word) {
    if (typeof window.addToErrorBook === 'function') {
      try { window.addToErrorBook(word.id); } catch (e) { /* ignore */ }
    }
    setTimeout(function () {
      currentWordIndex = findNextUnmasteredIndex(currentWordIndex);
      loadCurrentWord();
    }, 300);
  }

  function showBriefCheckmark() {
    if (!appEl) return;
    var check = document.createElement('div');
    check.className = 'shizi-brief-checkmark';
    check.textContent = '✓';
    appEl.appendChild(check);
    setTimeout(function () { if (check.parentNode) check.remove(); }, 800);
  }

  function renderAllMastered() {
    if (!appEl) return;
    appEl.innerHTML = '';
    var card = document.createElement('div');
    card.className = 'shizi-all-mastered';
    card.innerHTML = '<div class="shizi-all-mastered-emoji">🎉</div>' +
      '<h2>本关全部学会！</h2>' +
      '<p>太棒了！第' + currentLevel + '关的 10 个字都掌握啦~</p>';
    var backBtn = document.createElement('button');
    backBtn.className = 'shizi-control-btn';
    backBtn.type = 'button';
    backBtn.textContent = '← 返回';
    backBtn.addEventListener('click', function () { exitRecognizeMode(); });
    card.appendChild(backBtn);
    appEl.appendChild(card);
    if (typeof window.playWinSound === 'function') {
      try { window.playWinSound(); } catch (e) { /* ignore */ }
    }
  }

  /* ===== Expose ===== */
  window.startRecognizeMode = startRecognizeMode;
  window.exitRecognizeMode = exitRecognizeMode;
})();
