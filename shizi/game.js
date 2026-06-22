'use strict';

/* ===== game.js — main orchestrator for 识字乐园 =====
 *
 * Renders main screen, handles mode/level switching, progress views, celebrations.
 * Loaded LAST via <script defer> after all other modules.
 *
 * Globals exposed:
 *   init()                          — DOMContentLoaded handler
 *   showMainScreen()                — renders 3-entry main menu
 *   showLevelSelect(mode)           — renders level picker (mode = 'choice' | 'recognize')
 *   showProgressView()              — renders 100-char grid
 *   showCelebration(type)           — type = 'levelClear' | 'sticker'
 *   resetProgressWithConfirm()      — delegate to settings confirm dialog
 */

(function () {
  var appEl = null;
  var initialized = false;

  /* ===== Init ===== */
  function init() {
    if (initialized) return;
    initialized = true;
    appEl = document.getElementById('app');
    if (!appEl) {
      console.warn('game.js: #app container not found');
      return;
    }

    // Init subsystems (guard with typeof, all are idempotent)
    if (typeof window.initProgress === 'function') { try { window.initProgress(); } catch (e) {} }
    if (typeof window.initAudio === 'function') { try { window.initAudio(); } catch (e) {} }
    if (typeof window.initSettings === 'function') { try { window.initSettings(); } catch (e) {} }

    showMainScreen();

    // Prevent context menu globally (long-press on iOS)
    document.addEventListener('contextmenu', function (e) {
      if (e.target && e.target.tagName === 'IMG') e.preventDefault();
    });
  }

  /* ===== Main screen ===== */
  function showMainScreen() {
    if (!appEl) return;
    appEl.innerHTML = '';

    // Progress bar at top
    var progressBar = document.createElement('div');
    progressBar.className = 'shizi-progress-bar';
    var unlockedLevel = 1;
    var totalStars = 0;
    var totalLearned = 0;
    if (typeof window.getUnlockedLevel === 'function') {
      try { unlockedLevel = window.getUnlockedLevel(); } catch (e) {}
    }
    if (typeof window.getStats === 'function') {
      try { totalStars = window.getStats().totalStars || 0; } catch (e) {}
    }
    if (window.WORDS) {
      for (var i = 0; i < window.WORDS.length; i++) {
        if (typeof window.getWordProgress === 'function') {
          try {
            var wp = window.getWordProgress(window.WORDS[i].id);
            if (wp && wp.stars > 0) totalLearned++;
          } catch (e) {}
        }
      }
    }
    progressBar.innerHTML =
      '<span class="shizi-progress-stat">已学 ' + totalLearned + '/100</span>' +
      '<span class="shizi-progress-stat">第 ' + unlockedLevel + ' 关</span>' +
      '<span class="shizi-progress-stat">⭐ ' + totalStars + '</span>';
    appEl.appendChild(progressBar);

    // Title
    var title = document.createElement('h1');
    title.className = 'shizi-main-title';
    title.textContent = '识字乐园';
    appEl.appendChild(title);

    var subtitle = document.createElement('p');
    subtitle.className = 'shizi-main-subtitle';
    subtitle.textContent = '听一听，认一认，字宝宝跟你走';
    appEl.appendChild(subtitle);

    // Mode cards
    var grid = document.createElement('div');
    grid.className = 'shizi-mode-grid';

    grid.appendChild(makeModeCard('🎧', '听音选字', '听声音，选对的字', function () {
      showLevelSelect('choice');
    }));
    grid.appendChild(makeModeCard('👨‍👩‍👧', '亲子认字', '看字，家长考，看笔顺', function () {
      showLevelSelect('recognize');
    }));
    grid.appendChild(makeModeCard('📊', '我的字库', '看看学会了多少字', function () {
      showProgressView();
    }));

    appEl.appendChild(grid);

    // Sticker wall preview (if any stickers earned)
    renderStickerPreview();
  }

  function makeModeCard(emoji, title, desc, onClick) {
    var card = document.createElement('button');
    card.className = 'shizi-mode-card';
    card.type = 'button';
    var emojiEl = document.createElement('div');
    emojiEl.className = 'shizi-mode-emoji';
    emojiEl.textContent = emoji;
    card.appendChild(emojiEl);
    var titleEl = document.createElement('h2');
    titleEl.className = 'shizi-mode-name';
    titleEl.textContent = title;
    card.appendChild(titleEl);
    var descEl = document.createElement('p');
    descEl.className = 'shizi-mode-desc';
    descEl.textContent = desc;
    card.appendChild(descEl);
    card.addEventListener('click', onClick);
    return card;
  }

  function renderStickerPreview() {
    if (typeof window.getStickers !== 'function') return;
    var stickers;
    try { stickers = window.getStickers(); } catch (e) { return; }
    var total = (stickers.days7 || 0) + (stickers.days30 || 0) + (stickers.levelClear || []).length;
    if (total === 0) return;

    var wall = document.createElement('div');
    wall.className = 'shizi-sticker-preview';
    wall.innerHTML = '<h3>🏆 我的贴纸</h3>';
    var row = document.createElement('div');
    row.className = 'shizi-sticker-row';
    for (var d = 0; d < (stickers.days7 || 0); d++) {
      row.appendChild(makeStickerBadge('📅', '7天'));
    }
    for (var d2 = 0; d2 < (stickers.days30 || 0); d2++) {
      row.appendChild(makeStickerBadge('🌟', '30天'));
    }
    var clears = stickers.levelClear || [];
    for (var i = 0; i < clears.length; i++) {
      row.appendChild(makeStickerBadge('🎖', '第' + clears[i] + '关'));
    }
    wall.appendChild(row);
    appEl.appendChild(wall);
  }

  function makeStickerBadge(emoji, label) {
    var badge = document.createElement('span');
    badge.className = 'shizi-sticker-badge';
    badge.textContent = emoji + ' ' + label;
    return badge;
  }

  /* ===== Level select ===== */
  function showLevelSelect(mode) {
    if (!appEl) return;
    appEl.innerHTML = '';

    var header = document.createElement('div');
    header.className = 'shizi-mode-header';
    var backBtn = document.createElement('button');
    backBtn.className = 'shizi-back-btn';
    backBtn.type = 'button';
    backBtn.textContent = '← 返回';
    backBtn.addEventListener('click', function () { showMainScreen(); });
    header.appendChild(backBtn);
    var title = document.createElement('span');
    title.className = 'shizi-mode-title';
    title.textContent = mode === 'choice' ? '听音选字 · 选关卡' : '亲子认字 · 选关卡';
    header.appendChild(title);
    appEl.appendChild(header);

    var unlockedLevel = 1;
    if (typeof window.getUnlockedLevel === 'function') {
      try { unlockedLevel = window.getUnlockedLevel(); } catch (e) {}
    }

    var levelThemes = ['', '数字', '自然', '天地方位', '身体', '家庭', '动作', '颜色大小', '动物', '食物', '常用'];

    var grid = document.createElement('div');
    grid.className = 'shizi-level-grid';

    for (var lv = 1; lv <= 10; lv++) {
      var card = document.createElement('button');
      card.type = 'button';
      var locked = lv > unlockedLevel;
      card.className = locked ? 'shizi-level-card locked' : 'shizi-level-card';
      card.disabled = locked;

      // Progress within level
      var mastered = 0;
      if (window.WORDS_BY_LEVEL && window.WORDS_BY_LEVEL[lv] && typeof window.getWordProgress === 'function') {
        var words = window.WORDS_BY_LEVEL[lv];
        for (var i = 0; i < words.length; i++) {
          try {
            var wp = window.getWordProgress(words[i].id);
            if (wp && wp.stars >= 2) mastered++;
          } catch (e) {}
        }
      }

      if (locked) {
        card.innerHTML = '<div class="shizi-level-lock">🔒</div>' +
          '<div class="shizi-level-num">第 ' + lv + ' 关</div>' +
          '<div class="shizi-level-theme">' + (levelThemes[lv] || '') + '</div>' +
          '<div class="shizi-level-progress">完成第 ' + (lv - 1) + ' 关解锁</div>';
      } else {
        card.innerHTML = '<div class="shizi-level-num">第 ' + lv + ' 关</div>' +
          '<div class="shizi-level-theme">' + (levelThemes[lv] || '') + '</div>' +
          '<div class="shizi-level-progress">' + mastered + '/10 达标</div>';
        (function (levelNum) {
          card.addEventListener('click', function () {
            if (typeof window.playPlaceSound === 'function') {
              try { window.playPlaceSound(); } catch (e) {}
            }
            if (mode === 'choice' && typeof window.startChoiceMode === 'function') {
              window.startChoiceMode(levelNum);
            } else if (mode === 'recognize' && typeof window.startRecognizeMode === 'function') {
              window.startRecognizeMode(levelNum);
            }
          });
        })(lv);
      }
      grid.appendChild(card);
    }
    appEl.appendChild(grid);
  }

  /* ===== Progress view (我的字库) ===== */
  function showProgressView() {
    if (!appEl) return;
    appEl.innerHTML = '';

    var header = document.createElement('div');
    header.className = 'shizi-mode-header';
    var backBtn = document.createElement('button');
    backBtn.className = 'shizi-back-btn';
    backBtn.type = 'button';
    backBtn.textContent = '← 返回';
    backBtn.addEventListener('click', function () { showMainScreen(); });
    header.appendChild(backBtn);
    var title = document.createElement('span');
    title.className = 'shizi-mode-title';
    title.textContent = '我的字库';
    header.appendChild(title);
    appEl.appendChild(header);

    var levelThemes = ['', '数字', '自然', '天地方位', '身体', '家庭', '动作', '颜色大小', '动物', '食物', '常用'];

    for (var lv = 1; lv <= 10; lv++) {
      if (!window.WORDS_BY_LEVEL || !window.WORDS_BY_LEVEL[lv]) continue;
      var section = document.createElement('div');
      section.className = 'shizi-progress-section';
      var sectionTitle = document.createElement('h3');
      sectionTitle.className = 'shizi-progress-section-title';
      sectionTitle.textContent = '第 ' + lv + ' 关 · ' + (levelThemes[lv] || '');
      section.appendChild(sectionTitle);

      var row = document.createElement('div');
      row.className = 'shizi-progress-chars';
      var words = window.WORDS_BY_LEVEL[lv];
      for (var i = 0; i < words.length; i++) {
        var cell = document.createElement('div');
        cell.className = 'shizi-progress-char-cell';
        var wp = { stars: 0 };
        if (typeof window.getWordProgress === 'function') {
          try { wp = window.getWordProgress(words[i].id); } catch (e) {}
        }
        var stars = wp.stars || 0;
        var starsStr = '';
        for (var s = 0; s < 3; s++) starsStr += (s < stars) ? '⭐' : '·';
        cell.innerHTML =
          '<div class="shizi-progress-char">' + words[i].char + '</div>' +
          '<div class="shizi-progress-stars">' + starsStr + '</div>';
        if (stars === 0) cell.classList.add('unlearned');
        if (stars === 3) cell.classList.add('mastered');
        row.appendChild(cell);
      }
      section.appendChild(row);
      appEl.appendChild(section);
    }
  }

  /* ===== Celebration ===== */
  function showCelebration(type) {
    var overlay = document.getElementById('celebration-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'celebration-overlay';
      overlay.className = 'shizi-celebration-overlay';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = '';
    overlay.hidden = false;

    if (type === 'levelClear') {
      var card = document.createElement('div');
      card.className = 'shizi-celebration-card';
      card.innerHTML =
        '<div class="shizi-celebration-emoji">🎉</div>' +
        '<h2>新关卡解锁！</h2>' +
        '<p>太棒了！继续加油~</p>';
      overlay.appendChild(card);
      if (typeof window.playWinSound === 'function') {
        try { window.playWinSound(); } catch (e) {}
      }
    } else if (type === 'sticker') {
      var card2 = document.createElement('div');
      card2.className = 'shizi-celebration-card';
      card2.innerHTML =
        '<div class="shizi-celebration-emoji">🏆</div>' +
        '<h2>获得新贴纸！</h2>';
      overlay.appendChild(card2);
    }

    // Confetti
    var colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#fab1a0'];
    for (var i = 0; i < 30; i++) {
      var piece = document.createElement('div');
      piece.className = 'shizi-celebration-confetti';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = Math.random() * 0.5 + 's';
      piece.style.animationDuration = (1.5 + Math.random() * 1) + 's';
      overlay.appendChild(piece);
    }

    setTimeout(function () { overlay.hidden = true; }, 3000);
    overlay.addEventListener('click', function () { overlay.hidden = true; }, { once: true });
  }

  function resetProgressWithConfirm() {
    // Delegate to settings.js confirm dialog (triggered via reset button in parent panel)
    // This is a convenience entry point
    if (typeof window.openBabyGate === 'function') {
      try { window.openBabyGate(); } catch (e) {}
    }
  }

  /* ===== Expose ===== */
  window.init = init;
  window.showMainScreen = showMainScreen;
  window.showLevelSelect = showLevelSelect;
  window.showProgressView = showProgressView;
  window.showCelebration = showCelebration;
  window.resetProgressWithConfirm = resetProgressWithConfirm;

  /* ===== Auto-init on DOMContentLoaded ===== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
