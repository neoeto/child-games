'use strict';

/*
 * hint.js — 连线提示 (connection hint) system for JoJo Gomoku.
 * Self-contained vanilla JS module. Loaded after game.js via <script defer>.
 * Exposes globals: initHints, previewLinesAt, getHintData, clearHints,
 *                  setHintLevelInternal, getHintLevelInternal.
 * (Wave 2.5: setters/getters exposed as *Internal to avoid clashing with
 *  settings.js, which is the canonical user-facing source.)
 * Degrades gracefully if game.js symbols are absent (guarded via typeof).
 */
(function () {
  /* ===== Internal state ===== */
  var hintLevel = 'FULL';            // 'OFF' | 'SUBTLE' | 'FULL'
  var overlaySvg = null;
  var hintLayer = null;
  var boardWrapperEl = null;
  var currentHint = null;            // { row, col, lines, player, postPlacement? }
  var longPressTimer = null;
  var postPlacementTimer = null;
  var longPressStartCoords = null;
  var stylesInjected = false;
  var hintsInitialized = false;

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var LONG_PRESS_MS = 300;
  var DRAG_THRESHOLD_PX = 30;
  var DEFAULT_DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

  /* ===== Safe accessors to game.js globals ===== */
  function getBoardArr() {
    return (typeof board !== 'undefined') ? board : null;
  }
  function getDirs() {
    return (typeof DIRS !== 'undefined' && DIRS) ? DIRS : DEFAULT_DIRS;
  }
  function teamEq(a, b) {
    if (typeof sameTeam === 'function') return sameTeam(a, b);
    return a === b;
  }
  function getCellEl(row, col) {
    if (typeof cellEl === 'function') return cellEl(row, col);
    var size = (typeof BOARD_SIZE !== 'undefined') ? BOARD_SIZE : 9;
    var dom = document.querySelector('.board');
    if (!dom) return null;
    return dom.children[row * size + col] || null;
  }
  function nextFamilyChar() {
    if (typeof FAMILY_ORDER === 'undefined' || typeof familyRotationIndex === 'undefined') return null;
    return FAMILY_ORDER[familyRotationIndex];
  }
  function isFamilyTurn() {
    return (typeof currentPlayer !== 'undefined') && currentPlayer === 'family';
  }
  function isGameOver() {
    return (typeof gameOver !== 'undefined') && gameOver;
  }

  /* ============================================================
   * Algorithm: previewLinesAt
   * Temporarily places `player` at (row, col), scans 4 directions,
   * collects consecutive same-team cells (ordered visually via
   * unshift on backward walk), counts open ends, then restores.
   * Returns [{ direction, cells, length, openEnds }] for all dirs.
   * ============================================================ */
  function previewLinesAt(boardArr, row, col, player) {
    if (!boardArr || !boardArr.length) return [];
    var size = boardArr.length;
    var dirs = getDirs();
    var saved = boardArr[row][col];
    boardArr[row][col] = player;

    var results = [];
    for (var d = 0; d < dirs.length; d++) {
      var dr = dirs[d][0];
      var dc = dirs[d][1];
      var cells = [{ row: row, col: col }];

      // Forward walk: push teammates
      var r = row + dr;
      var c = col + dc;
      while (r >= 0 && r < size && c >= 0 && c < size &&
             boardArr[r][c] !== null && teamEq(boardArr[r][c], player)) {
        cells.push({ row: r, col: c });
        r += dr;
        c += dc;
      }
      // (r,c) now sits just past the last forward teammate.
      var fwdOpen = (r >= 0 && r < size && c >= 0 && c < size && boardArr[r][c] === null);

      // Backward walk: unshift to preserve visual order
      r = row - dr;
      c = col - dc;
      while (r >= 0 && r < size && c >= 0 && c < size &&
             boardArr[r][c] !== null && teamEq(boardArr[r][c], player)) {
        cells.unshift({ row: r, col: c });
        r -= dr;
        c -= dc;
      }
      var bwdOpen = (r >= 0 && r < size && c >= 0 && c < size && boardArr[r][c] === null);

      results.push({
        direction: [dr, dc],
        cells: cells,
        length: cells.length,
        openEnds: (fwdOpen ? 1 : 0) + (bwdOpen ? 1 : 0)
      });
    }

    boardArr[row][col] = saved;
    return results;
  }

  /* ============================================================
   * getHintData: returns filtered hint payload (length >= 2) or null.
   * ============================================================ */
  function getHintData(row, col) {
    if (!isFamilyTurn()) return null;
    if (isGameOver()) return null;
    var boardArr = getBoardArr();
    if (!boardArr) return null;
    if (row < 0 || row >= boardArr.length || col < 0 || col >= boardArr.length) return null;
    if (boardArr[row][col] !== null) return null;
    var player = nextFamilyChar();
    if (!player) return null;
    var lines = previewLinesAt(boardArr, row, col, player);
    var kept = [];
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].length >= 2) kept.push(lines[i]);
    }
    return { player: player, lines: kept };
  }

  /* ============================================================
   * Style injection (keyframes for pulse + sparkles + glow).
   * Injected once so we don't touch style.css.
     ============================================================ */
  function injectStyles() {
    if (stylesInjected) return;
    if (document.getElementById('hint-styles')) {
      stylesInjected = true;
      return;
    }
    var css = [
      '@keyframes hintPulse {',
      '  from { filter: brightness(1) drop-shadow(0 0 0 transparent); }',
      '  to   { filter: brightness(1.15) drop-shadow(0 0 12px #ffe082); }',
      '}',
      '.cell.hint-glow {',
      '  animation: hintPulse 0.5s ease-in-out infinite alternate;',
      '  overflow: visible;',
      '  z-index: 5;',
      '}',
      '@keyframes hintSparkleRise {',
      '  0%   { transform: translate(0, 0) scale(0.5); opacity: 0; }',
      '  25%  { opacity: 1; }',
      '  100% { transform: translate(0, -26px) scale(1.15); opacity: 0; }',
      '}',
      '.hint-sparkle {',
      '  animation: hintSparkleRise 900ms ease-out infinite;',
      '  will-change: transform, opacity;',
      '}'
    ].join('\n');
    var style = document.createElement('style');
    style.id = 'hint-styles';
    style.textContent = css;
    document.head.appendChild(style);
    stylesInjected = true;
  }

  /* ============================================================
   * Overlay setup: SVG (lines + count dots) and hint-layer div
   * (ghost piece + sparkles), both absolutely positioned over board.
   * ============================================================ */
  function ensureOverlay() {
    if (overlaySvg && overlaySvg.parentNode && hintLayer && hintLayer.parentNode) return;
    boardWrapperEl = document.querySelector('.board-wrapper');
    if (!boardWrapperEl) return;
    if (window.getComputedStyle(boardWrapperEl).position === 'static') {
      boardWrapperEl.style.position = 'relative';
    }

    if (!overlaySvg || !overlaySvg.parentNode) {
      overlaySvg = document.createElementNS(SVG_NS, 'svg');
      overlaySvg.setAttribute('class', 'hint-overlay');
      overlaySvg.style.position = 'absolute';
      overlaySvg.style.top = '0';
      overlaySvg.style.left = '0';
      overlaySvg.style.width = '100%';
      overlaySvg.style.height = '100%';
      overlaySvg.style.pointerEvents = 'none';
      overlaySvg.style.overflow = 'visible';
      overlaySvg.style.zIndex = '20';
      boardWrapperEl.appendChild(overlaySvg);
    }

    if (!hintLayer || !hintLayer.parentNode) {
      hintLayer = document.createElement('div');
      hintLayer.className = 'hint-layer';
      hintLayer.style.position = 'absolute';
      hintLayer.style.top = '0';
      hintLayer.style.left = '0';
      hintLayer.style.width = '100%';
      hintLayer.style.height = '100%';
      hintLayer.style.pointerEvents = 'none';
      hintLayer.style.zIndex = '21';
      boardWrapperEl.appendChild(hintLayer);
    }
  }

  function cellCenter(row, col) {
    var cell = getCellEl(row, col);
    if (!cell || !boardWrapperEl) return null;
    var wRect = boardWrapperEl.getBoundingClientRect();
    var cRect = cell.getBoundingClientRect();
    return {
      x: cRect.left + cRect.width / 2 - wRect.left,
      y: cRect.top + cRect.height / 2 - wRect.top,
      size: cRect.width
    };
  }

  function syncViewBox() {
    if (!overlaySvg || !boardWrapperEl) return;
    var rect = boardWrapperEl.getBoundingClientRect();
    overlaySvg.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);
  }

  /* ============================================================
   * Rendering
   * ============================================================ */
  function renderHint(row, col, lines, player) {
    clearHints();
    if (!lines || lines.length === 0) return;
    ensureOverlay();
    if (!overlaySvg || !hintLayer) return;
    currentHint = { row: row, col: col, lines: lines, player: player };

    // Apply glow to every cell participating in any line (incl. target).
    var glow = {};
    for (var i = 0; i < lines.length; i++) {
      var cs = lines[i].cells;
      for (var j = 0; j < cs.length; j++) {
        glow[cs[j].row + ',' + cs[j].col] = true;
      }
    }
    var keys = Object.keys(glow);
    for (var k = 0; k < keys.length; k++) {
      var parts = keys[k].split(',');
      var cell = getCellEl(parseInt(parts[0], 10), parseInt(parts[1], 10));
      if (cell) cell.classList.add('hint-glow');
    }

    if (hintLevel !== 'FULL') return; // SUBTLE stops at glow

    syncViewBox();
    renderGhost(row, col, player);
    for (var li = 0; li < lines.length; li++) {
      renderLine(lines[li]);
      renderCountDots(lines[li]);
      if (lines[li].length >= 3) renderSparkles(lines[li]);
    }
  }

  function renderGhost(row, col, player) {
    if (!player) return;
    var center = cellCenter(row, col);
    if (!center) return;
    var img = document.createElement('img');
    img.src = 'resources/' + player + '.png';
    img.alt = '';
    img.draggable = false;
    img.className = 'hint-ghost';
    img.style.position = 'absolute';
    img.style.left = (center.x - center.size / 2) + 'px';
    img.style.top = (center.y - center.size / 2) + 'px';
    img.style.width = center.size + 'px';
    img.style.height = center.size + 'px';
    img.style.padding = '4px';
    img.style.objectFit = 'contain';
    img.style.opacity = '0.4';
    img.style.pointerEvents = 'none';
    img.style.webkitUserDrag = 'none';
    hintLayer.appendChild(img);
  }

  function renderLine(line) {
    if (!line.cells || line.cells.length < 2) return;
    var pts = [];
    for (var i = 0; i < line.cells.length; i++) {
      var p = cellCenter(line.cells[i].row, line.cells[i].col);
      if (p) pts.push(p);
    }
    if (pts.length < 2) return;

    var first = pts[0];
    var last = pts[pts.length - 1];
    var dx = last.x - first.x;
    var dy = last.y - first.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    // Perpendicular unit vector for a gentle bow (makes it a curve).
    var perpX = -dy / len;
    var perpY = dx / len;
    var bow = Math.min(12, len * 0.08);
    var midX = (first.x + last.x) / 2 + perpX * bow;
    var midY = (first.y + last.y) / 2 + perpY * bow;

    var strokeW = Math.max(4, first.size / 3);

    var path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', 'M ' + first.x + ' ' + first.y +
                            ' Q ' + midX + ' ' + midY + ' ' + last.x + ' ' + last.y);
    path.setAttribute('stroke', '#ffd000');
    path.setAttribute('stroke-width', String(strokeW));
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('fill', 'none');
    path.setAttribute('opacity', '0.5');
    path.classList.add('hint-line');
    overlaySvg.appendChild(path);

    // 400ms draw-in via stroke-dasharray animation.
    var totalLen = path.getTotalLength();
    path.style.strokeDasharray = String(totalLen);
    path.style.strokeDashoffset = String(totalLen);
    path.style.transition = 'stroke-dashoffset 400ms ease-out';
    // Double rAF to ensure the browser registers the starting offset.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        path.style.strokeDashoffset = '0';
      });
    });
  }

  function renderCountDots(line) {
    if (!line.cells || line.cells.length === 0) return;
    var pts = [];
    for (var i = 0; i < line.cells.length; i++) {
      var p = cellCenter(line.cells[i].row, line.cells[i].col);
      if (p) pts.push(p);
    }
    if (pts.length === 0) return;
    var first = pts[0];
    var last = pts[pts.length - 1];
    var midX = (first.x + last.x) / 2;
    var midY = (first.y + last.y) / 2;
    var cellSize = pts[0].size;
    var dotR = Math.max(3, cellSize / 10);
    var gap = dotR * 2.6;
    var n = line.length;
    var totalW = (n - 1) * gap;
    // Place dots horizontally below the line midpoint on screen.
    var cx = midX;
    var cy = midY + cellSize * 0.55;
    for (var k = 0; k < n; k++) {
      var t = n === 1 ? 0 : (k * gap - totalW / 2);
      var dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', String(cx + t));
      dot.setAttribute('cy', String(cy));
      dot.setAttribute('r', String(dotR));
      dot.setAttribute('fill', '#ffb300');
      dot.classList.add('hint-count-dot');
      overlaySvg.appendChild(dot);
    }
  }

  function renderSparkles(line) {
    if (!line.cells || line.cells.length < 2) return;
    var pts = [];
    for (var i = 0; i < line.cells.length; i++) {
      var p = cellCenter(line.cells[i].row, line.cells[i].col);
      if (p) pts.push(p);
    }
    if (pts.length < 2) return;
    var cellSize = pts[0].size;
    var colors = ['#ffd000', '#ff8c1a', '#ff5a8a', '#8a9bf0', '#7ad67a', '#b47aff', '#5ad1e0'];
    var count = 8 + Math.floor(Math.random() * 5); // 8..12
    var segs = pts.length - 1;
    for (var i = 0; i < count; i++) {
      var t = Math.random();
      var segIdx = Math.min(Math.floor(t * segs), segs - 1);
      var localT = t * segs - segIdx;
      var a = pts[segIdx];
      var b = pts[segIdx + 1];
      var x = a.x + (b.x - a.x) * localT + (Math.random() - 0.5) * cellSize * 0.3;
      var y = a.y + (b.y - a.y) * localT + (Math.random() - 0.5) * cellSize * 0.3;
      var sz = cellSize * 0.12;
      var sp = document.createElement('div');
      sp.className = 'hint-sparkle';
      sp.style.position = 'absolute';
      sp.style.left = (x - sz / 2) + 'px';
      sp.style.top = (y - sz / 2) + 'px';
      sp.style.width = sz + 'px';
      sp.style.height = sz + 'px';
      sp.style.borderRadius = '50%';
      sp.style.background = colors[Math.floor(Math.random() * colors.length)];
      sp.style.pointerEvents = 'none';
      sp.style.animationDelay = (Math.random() * 0.6) + 's';
      hintLayer.appendChild(sp);
    }
  }

  /* ============================================================
   * clearHints: remove every visual artifact we may have created.
   * ============================================================ */
  function clearHints() {
    if (postPlacementTimer !== null) {
      window.clearTimeout(postPlacementTimer);
      postPlacementTimer = null;
    }
    if (overlaySvg) {
      while (overlaySvg.firstChild) overlaySvg.removeChild(overlaySvg.firstChild);
    }
    if (hintLayer) {
      while (hintLayer.firstChild) hintLayer.removeChild(hintLayer.firstChild);
    }
    var glows = document.querySelectorAll('.board .cell.hint-glow');
    for (var i = 0; i < glows.length; i++) {
      glows[i].classList.remove('hint-glow');
    }
    currentHint = null;
  }

  /* ============================================================
   * Trigger logic
   * ============================================================ */
  function shouldTrigger() {
    if (hintLevel === 'OFF') return false;
    if (!isFamilyTurn()) return false;
    if (isGameOver()) return false;
    return true;
  }

  function triggerHint(row, col) {
    if (!shouldTrigger()) return;
    var data = getHintData(row, col);
    if (!data || data.lines.length === 0) {
      clearHints();
      return;
    }
    renderHint(row, col, data.lines, data.player);
  }

  function showHintForPlacement(row, col, char) {
    if (hintLevel === 'OFF') return;
    if (typeof isFamily === 'function' && !isFamily(char)) return;

    if (postPlacementTimer !== null) {
      window.clearTimeout(postPlacementTimer);
      postPlacementTimer = null;
    }

    clearHints();

    var boardArr = getBoardArr();
    if (!boardArr) return;
    var lines = previewLinesAt(boardArr, row, col, char);
    var filtered = [];
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].length >= 2) filtered.push(lines[i]);
    }
    if (filtered.length === 0) return;

    renderHint(row, col, filtered, char);
    currentHint = { row: row, col: col, lines: filtered, player: char, postPlacement: true };

    var savedRow = row, savedCol = col;
    postPlacementTimer = window.setTimeout(function () {
      postPlacementTimer = null;
      if (currentHint && currentHint.postPlacement &&
          currentHint.row === savedRow && currentHint.col === savedCol) {
        clearHints();
      }
    }, 3000);
  }

  /* ============================================================
   * Pointer event handlers
   * ============================================================ */
  function onCellPointerEnter(e) {
    if (e.pointerType !== 'mouse') return; // hover is desktop-only
    if (!shouldTrigger()) return;
    var cell = e.currentTarget;
    var row = parseInt(cell.dataset.row, 10);
    var col = parseInt(cell.dataset.col, 10);
    if (currentHint && currentHint.row === row && currentHint.col === col) return;
    triggerHint(row, col);
  }

  function onCellPointerLeave() {
    // Cancel any pending long-press and clear hover hints.
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    longPressStartCoords = null;
    if (currentHint && currentHint.postPlacement) return;
    clearHints();
  }

  function onCellPointerDown(e) {
    if (e.pointerType === 'mouse') return; // mouse uses hover path
    if (!shouldTrigger()) return;
    var cell = e.currentTarget;
    var row = parseInt(cell.dataset.row, 10);
    var col = parseInt(cell.dataset.col, 10);
    var boardArr = getBoardArr();
    if (!boardArr) return;
    if (boardArr[row][col] !== null) return;
    longPressStartCoords = { x: e.clientX, y: e.clientY };
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    clearHints();
    var r = row, c = col;
    longPressTimer = setTimeout(function () {
      longPressTimer = null;
      triggerHint(r, c);
    }, LONG_PRESS_MS);
  }

  function onCellPointerMove(e) {
    if (!longPressStartCoords) return;
    var dx = e.clientX - longPressStartCoords.x;
    var dy = e.clientY - longPressStartCoords.y;
    if (dx * dx + dy * dy > DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      longPressStartCoords = null;
      clearHints();
    }
  }

  function onCellPointerUp() {
    // Cancel timer if still pending. Whether or not the long-press hint
    // fired, game.js's own pointerup handler performs the actual placement
    // (it is registered first, so it runs before this listener). We only
    // need to clear hint visuals so the real stone renders cleanly.
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    longPressStartCoords = null;
    if (currentHint && currentHint.postPlacement) return;
    clearHints();
  }

  /* ============================================================
   * Resize / orientation: recompute pixel coords and redraw.
   * ============================================================ */
  function onViewportChange() {
    if (!currentHint) return;
    var row = currentHint.row;
    var col = currentHint.col;
    var player = currentHint.player;
    var data = getHintData(row, col);
    if (!data || data.lines.length === 0) {
      clearHints();
      return;
    }
    renderHint(row, col, data.lines, player);
  }

  /* ============================================================
   * Level control
   * ============================================================ */
  function setHintLevel(level) {
    if (level !== 'OFF' && level !== 'SUBTLE' && level !== 'FULL') return;
    hintLevel = level;
    if (level === 'OFF') {
      clearHints();
      return;
    }
    if (currentHint) {
      var data = getHintData(currentHint.row, currentHint.col);
      if (data && data.lines.length > 0) {
        renderHint(currentHint.row, currentHint.col, data.lines, data.player);
      } else {
        clearHints();
      }
    }
  }

  function getHintLevel() {
    return hintLevel;
  }

  /* ============================================================
   * Init: attach overlay + listeners to every .cell.
   * Safe to call multiple times (guarded). Cell-listener binding is
   * split out so game.js rebuildBoard() can re-bind after regenerating
   * the DOM (the overlay/resize listeners stay one-shot).
   * ============================================================ */
  function attachCellHintListeners() {
    var cells = document.querySelectorAll('.cell');
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      // Idempotent: rebuildBoard regenerates DOM nodes, so new cells start
      // unmarked; already-bound cells (e.g. after initHints+rebuild) are skipped.
      if (cell.dataset.hintBound === '1') continue;
      cell.dataset.hintBound = '1';
      cell.addEventListener('pointerenter', onCellPointerEnter);
      cell.addEventListener('pointerleave', onCellPointerLeave);
      cell.addEventListener('pointerdown', onCellPointerDown);
      cell.addEventListener('pointermove', onCellPointerMove);
      cell.addEventListener('pointerup', onCellPointerUp);
      cell.addEventListener('pointercancel', onCellPointerUp);
    }
  }

  function initHints() {
    if (hintsInitialized) return;
    hintsInitialized = true;
    injectStyles();
    ensureOverlay();
    attachCellHintListeners();

    window.addEventListener('resize', onViewportChange);
    window.addEventListener('orientationchange', onViewportChange);
  }

  /* ===== Public API ===== */
  window.initHints = initHints;
  window.rebindHintCells = attachCellHintListeners;
  window.previewLinesAt = previewLinesAt;
  window.getHintData = getHintData;
  window.clearHints = clearHints;
  window.showHintForPlacement = showHintForPlacement;
  window.setHintLevelInternal = setHintLevel;
  window.getHintLevelInternal = getHintLevel;

  /* ===== Auto-init on DOMContentLoaded (game.js init runs first) ===== */
  document.addEventListener('DOMContentLoaded', initHints);
})();
