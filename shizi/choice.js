'use strict';

/* ===== choice.js — listening quiz mode (听音选字) for 识字乐园 =====
 *
 * Renders listening quiz UI into #app. Player hears a character pronounced,
 * then picks the correct character from 4 options.
 *
 * Globals exposed:
 *   startChoiceMode(level)   — level: number 1-10; renders UI, starts first question
 *   exitChoiceMode()         — cleanup, return to main screen
 */

(function () {
  var appEl = null;
  var currentLevel = 1;
  var targetWord = null;
  var options = []; // [{word, label:'A'|'B'|'C'|'D', correct:bool}]
  var answered = false;

  function startChoiceMode(level) {
    currentLevel = level || 1;
    appEl = document.getElementById('app');
    if (!appEl) return;
    answered = false;
    nextQuestion();
  }

  function exitChoiceMode() {
    appEl = document.getElementById('app');
    if (appEl) appEl.innerHTML = '';
    targetWord = null;
    options = [];
    answered = false;
    if (typeof window.showMainScreen === 'function') {
      try { window.showMainScreen(); } catch (e) { /* ignore */ }
    }
  }

  /* ===== Question generation ===== */
  function nextQuestion() {
    answered = false;
    targetWord = pickTargetWord();
    options = generateOptions(targetWord);
    renderQuestion();
    // Auto-play pronunciation after short delay
    setTimeout(function () {
      if (targetWord && typeof window.speak === 'function') {
        try { window.speak(targetWord.char); } catch (e) { /* ignore */ }
      }
    }, 300);
  }

  function pickTargetWord() {
    if (!window.WORDS_BY_LEVEL || !window.WORDS_BY_LEVEL[currentLevel]) return null;
    var levelWords = window.WORDS_BY_LEVEL[currentLevel];

    // 50% chance to pick from error book (filter by current level)
    var errorBook = [];
    if (typeof window.getErrorBook === 'function') {
      try { errorBook = window.getErrorBook() || []; } catch (e) { /* ignore */ }
    }
    var levelErrors = [];
    for (var i = 0; i < errorBook.length; i++) {
      for (var j = 0; j < levelWords.length; j++) {
        if (levelWords[j].id === errorBook[i]) {
          // Only include if not yet mastered
          var wp = typeof window.getWordProgress === 'function' ? window.getWordProgress(errorBook[i]) : null;
          if (!wp || wp.stars < 3) levelErrors.push(levelWords[j]);
          break;
        }
      }
    }
    if (levelErrors.length > 0 && Math.random() < 0.5) {
      return levelErrors[Math.floor(Math.random() * levelErrors.length)];
    }

    // Else: pick random from level where stars < 3
    var candidates = [];
    for (var k = 0; k < levelWords.length; k++) {
      var wp2 = typeof window.getWordProgress === 'function' ? window.getWordProgress(levelWords[k].id) : null;
      if (!wp2 || wp2.stars < 3) candidates.push(levelWords[k]);
    }
    if (candidates.length === 0) candidates = levelWords; // all mastered, pick any
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function generateOptions(target) {
    if (!target || !window.WORDS_BY_LEVEL || !window.WORDS_BY_LEVEL[currentLevel]) return [];
    var levelWords = window.WORDS_BY_LEVEL[currentLevel];
    var pool = [];
    for (var i = 0; i < levelWords.length; i++) {
      if (levelWords[i].id !== target.id) pool.push(levelWords[i]);
    }
    // Shuffle pool and take 3
    shuffle(pool);
    var distractors = pool.slice(0, 3);
    var all = [{ word: target, correct: true }].concat(
      distractors.map(function (w) { return { word: w, correct: false }; })
    );
    shuffle(all);
    var labels = ['A', 'B', 'C', 'D'];
    for (var j = 0; j < all.length; j++) all[j].label = labels[j];
    return all;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }

  /* ===== Rendering ===== */
  function renderQuestion() {
    if (!appEl) return;
    appEl.innerHTML = '';

    // Header
    var header = document.createElement('div');
    header.className = 'shizi-mode-header';
    var backBtn = document.createElement('button');
    backBtn.className = 'shizi-back-btn';
    backBtn.type = 'button';
    backBtn.textContent = '← 返回';
    backBtn.addEventListener('click', function () { exitChoiceMode(); });
    header.appendChild(backBtn);
    var title = document.createElement('span');
    title.className = 'shizi-mode-title';
    title.textContent = '第' + currentLevel + '关 · 听音选字';
    header.appendChild(title);
    appEl.appendChild(header);

    // Speaker area
    var speakerArea = document.createElement('div');
    speakerArea.className = 'shizi-speaker-area';

    var speakerIcon = document.createElement('div');
    speakerIcon.className = 'shizi-speaker-icon';
    speakerIcon.textContent = '🔊';
    speakerArea.appendChild(speakerIcon);

    var instruction = document.createElement('p');
    instruction.className = 'shizi-instruction';
    instruction.textContent = '听一听，选一选';
    speakerArea.appendChild(instruction);

    // TTS fallback: show pinyin if TTS unavailable
    if (typeof window.isTtsAvailable === 'function' && !window.isTtsAvailable() && targetWord) {
      var pinyinHint = document.createElement('p');
      pinyinHint.className = 'shizi-pinyin-hint';
      pinyinHint.textContent = targetWord.pinyin;
      speakerArea.appendChild(pinyinHint);
    }

    appEl.appendChild(speakerArea);

    // Options grid
    var optionsGrid = document.createElement('div');
    optionsGrid.className = 'shizi-options-grid';
    for (var i = 0; i < options.length; i++) {
      optionsGrid.appendChild(makeOptionCard(options[i]));
    }
    appEl.appendChild(optionsGrid);

    // Listen again button
    var listenAgainBtn = document.createElement('button');
    listenAgainBtn.className = 'shizi-listen-again-btn';
    listenAgainBtn.type = 'button';
    listenAgainBtn.textContent = '🔁 再听一次';
    listenAgainBtn.addEventListener('click', function () {
      if (targetWord && typeof window.speak === 'function') {
        try { window.speak(targetWord.char); } catch (e) { /* ignore */ }
      }
      // Restart speaker animation
      speakerIcon.classList.remove('speaking');
      void speakerIcon.offsetWidth; // force reflow
      speakerIcon.classList.add('speaking');
    });
    appEl.appendChild(listenAgainBtn);

    // Start speaker animation
    speakerIcon.classList.add('speaking');
  }

  function makeOptionCard(opt) {
    var card = document.createElement('button');
    card.className = 'shizi-option-card';
    card.type = 'button';
    card.dataset.correct = opt.correct ? 'true' : 'false';

    var charEl = document.createElement('span');
    charEl.className = 'shizi-option-char';
    charEl.textContent = opt.word.char;
    card.appendChild(charEl);

    var labelEl = document.createElement('span');
    labelEl.className = 'shizi-option-label';
    labelEl.textContent = opt.label;
    card.appendChild(labelEl);

    card.addEventListener('click', function () { handleOptionClick(opt, card); });
    return card;
  }

  /* ===== Click handling ===== */
  function handleOptionClick(opt, card) {
    if (answered) return;

    if (!opt.correct) {
      // Wrong: grey out this card, keep others clickable
      card.classList.add('wrong');
      card.disabled = true;
      if (typeof window.playWrongSound === 'function') {
        try { window.playWrongSound(); } catch (e) { /* ignore */ }
      }
      // Add TARGET to error book (player failed to recognize the target)
      if (targetWord && typeof window.addToErrorBook === 'function') {
        try { window.addToErrorBook(targetWord.id); } catch (e) { /* ignore */ }
      }
      // Show brief encouragement
      showEncouragement();
      return;
    }

    // Correct
    answered = true;
    card.classList.add('correct');
    // Disable all cards
    var cards = appEl.querySelectorAll('.shizi-option-card');
    for (var i = 0; i < cards.length; i++) cards[i].disabled = true;

    if (typeof window.playCorrectSound === 'function') {
      try { window.playCorrectSound(); } catch (e) { /* ignore */ }
    }
    if (targetWord && typeof window.recordListenCorrect === 'function') {
      try { window.recordListenCorrect(targetWord.id); } catch (e) { /* ignore */ }
    }
    // Check level unlock
    if (typeof window.checkLevelUnlock === 'function') {
      try {
        var result = window.checkLevelUnlock();
        if (result && result.unlocked && typeof window.showCelebration === 'function') {
          try { window.showCelebration('levelClear'); } catch (e2) { /* ignore */ }
        }
      } catch (e3) { /* ignore */ }
    }
    showCelebration();
    setTimeout(function () { nextQuestion(); }, 2000);
  }

  function showEncouragement() {
    if (!appEl) return;
    var existing = appEl.querySelector('.shizi-encouragement');
    if (existing) existing.remove();
    var msg = document.createElement('div');
    msg.className = 'shizi-encouragement';
    msg.textContent = '💪 再试试~';
    appEl.appendChild(msg);
    setTimeout(function () { if (msg.parentNode) msg.remove(); }, 1500);
  }

  function showCelebration() {
    if (!appEl) return;
    var overlay = document.createElement('div');
    overlay.className = 'shizi-mini-celebration';
    overlay.textContent = '🎉 答对啦！';
    appEl.appendChild(overlay);
    // Confetti
    var colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
    for (var i = 0; i < 12; i++) {
      var piece = document.createElement('div');
      piece.className = 'shizi-confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = Math.random() * 0.3 + 's';
      piece.style.animationDuration = (1 + Math.random() * 0.8) + 's';
      overlay.appendChild(piece);
    }
    setTimeout(function () { if (overlay.parentNode) overlay.remove(); }, 1800);
  }

  /* ===== Expose ===== */
  window.startChoiceMode = startChoiceMode;
  window.exitChoiceMode = exitChoiceMode;
})();
