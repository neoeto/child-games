'use strict';

/* ===== Constants ===== */
let BOARD_SIZE = 13;
const FAMILY_ORDER = ['jojo', 'baba', 'mama', 'gege', 'jiejie'];
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

const FAMILY_LABELS = {
  jojo: 'JoJo',
  baba: '爸爸',
  mama: '妈妈',
  gege: '哥哥',
  jiejie: '姐姐',
};

const DRAG_THRESHOLD = 30; // px — movement beyond this cancels the press

/* ===== State ===== */
let board = [];
let currentPlayer = 'family'; // 'family' | 'wolf'
let familyRotationIndex = 0;
let moveHistory = [];
let gameOver = false;
let cellNodes = []; // flat array of .cell elements (rebuilt by rebuildBoard)

/* ===== DOM refs (filled in init) ===== */
let boardEl = null;
let turnAvatarEl = null;
let turnLabelEl = null;
let victoryOverlayEl = null;
let victoryAvatarEl = null;
let victoryTextEl = null;

/* ===== Pointer tracking for palm rejection ===== */
let activePointerId = null;
let pointerStartCoords = null;
let pointerCancelled = false;
let lastPointerType = null;

/* ===== Helpers ===== */
function isFamily(char) {
  return FAMILY_ORDER.indexOf(char) !== -1;
}

function sameTeam(a, b) {
  if (a === b) return true;
  if (isFamily(a) && isFamily(b)) return true;
  return false;
}

function getNextFamilyChar() {
  const char = FAMILY_ORDER[familyRotationIndex];
  familyRotationIndex = (familyRotationIndex + 1) % FAMILY_ORDER.length;
  return char;
}

function cellEl(row, col) {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;
  return cellNodes[row * BOARD_SIZE + col] || null;
}

/* ===== Core Game Logic ===== */
function placeStone(row, col) {
  if (gameOver) return;
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
  if (board[row][col] !== null) return;

  const prevPlayer = currentPlayer;
  const prevRotationIndex = familyRotationIndex;

  let char;
  if (currentPlayer === 'family') {
    char = getNextFamilyChar();
  } else {
    char = 'wolf';
  }

  board[row][col] = char;
  renderStone(row, col, char);
  moveHistory.push({ row, col, char, prevPlayer, prevRotationIndex });

  if (typeof playPlaceSound === 'function') {
    try { playPlaceSound(); } catch (e) { /* ignore audio failures */ }
  }

  const winResult = checkWin(row, col, char);
  if (winResult) {
    if (typeof playWinSound === 'function') {
      try { playWinSound(); } catch (e) { /* ignore audio failures */ }
    }
    showVictory(winResult.winner);
    return;
  }

  if (moveHistory.length === BOARD_SIZE * BOARD_SIZE) {
    showDraw();
    return;
  }

  const longest = longestLineAt(row, col, char);
  if (longest >= 3 && typeof playCheerSound === 'function') {
    try { playCheerSound(longest); } catch (e) { /* ignore audio failures */ }
  }

  if (isFamily(char) && typeof showHintForPlacement === 'function') {
    try { showHintForPlacement(row, col, char); } catch (e) { /* ignore */ }
  }

  currentPlayer = (currentPlayer === 'family') ? 'wolf' : 'family';
  updateTurnIndicator();
}

function renderStone(row, col, char) {
  const cell = cellEl(row, col);
  if (!cell) return;
  cell.innerHTML = '';
  const stone = document.createElement('div');
  stone.className = 'stone ' + (isFamily(char) ? 'family' : 'wolf');
  const img = document.createElement('img');
  img.src = 'resources/' + char + '.png';
  img.alt = (FAMILY_LABELS[char] || '狼');
  img.draggable = false;
  stone.appendChild(img);
  cell.appendChild(stone);
}

function checkWin(row, col, char) {
  for (let d = 0; d < DIRS.length; d++) {
    const dr = DIRS[d][0];
    const dc = DIRS[d][1];
    const cells = [{ row: row, col: col }];

    // Forward direction
    let r = row + dr;
    let c = col + dc;
    while (
      r >= 0 && r < BOARD_SIZE &&
      c >= 0 && c < BOARD_SIZE &&
      board[r][c] !== null && sameTeam(board[r][c], char)
    ) {
      cells.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    // Backward direction
    r = row - dr;
    c = col - dc;
    while (
      r >= 0 && r < BOARD_SIZE &&
      c >= 0 && c < BOARD_SIZE &&
      board[r][c] !== null && sameTeam(board[r][c], char)
    ) {
      cells.unshift({ row: r, col: c });
      r -= dr;
      c -= dc;
    }

    if (cells.length >= 5) {
      const winner = isFamily(char) ? 'family' : 'wolf';
      return { winner: winner, cells: cells };
    }
  }
  return null;
}

function longestLineAt(row, col, char) {
  let max = 1;
  for (let d = 0; d < DIRS.length; d++) {
    const dr = DIRS[d][0];
    const dc = DIRS[d][1];
    let count = 1;

    let r = row + dr;
    let c = col + dc;
    while (
      r >= 0 && r < BOARD_SIZE &&
      c >= 0 && c < BOARD_SIZE &&
      board[r][c] !== null && sameTeam(board[r][c], char)
    ) {
      count++;
      r += dr;
      c += dc;
    }

    r = row - dr;
    c = col - dc;
    while (
      r >= 0 && r < BOARD_SIZE &&
      c >= 0 && c < BOARD_SIZE &&
      board[r][c] !== null && sameTeam(board[r][c], char)
    ) {
      count++;
      r -= dr;
      c -= dc;
    }

    if (count > max) max = count;
  }
  return max;
}

function undoLastMove() {
  if (gameOver) return;
  if (moveHistory.length === 0) return;
  const last = moveHistory.pop();
  board[last.row][last.col] = null;
  const cell = cellEl(last.row, last.col);
  if (cell) cell.innerHTML = '';

  currentPlayer = last.prevPlayer;
  familyRotationIndex = last.prevRotationIndex;

  updateTurnIndicator();
}

function resetGame() {
  board = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row = new Array(BOARD_SIZE);
    for (let c = 0; c < BOARD_SIZE; c++) row[c] = null;
    board.push(row);
  }
  currentPlayer = 'family';
  familyRotationIndex = 0;
  moveHistory = [];
  gameOver = false;

  for (let i = 0; i < cellNodes.length; i++) {
    cellNodes[i].innerHTML = '';
  }
  hideVictory();
  setUndoEnabled(true);
  updateTurnIndicator();
}

/* ===== Turn Indicator ===== */
function updateTurnIndicator() {
  if (!turnAvatarEl || !turnLabelEl) return;
  if (currentPlayer === 'family') {
    const nextChar = FAMILY_ORDER[familyRotationIndex];
    turnAvatarEl.src = 'resources/' + nextChar + '.png';
    turnAvatarEl.alt = FAMILY_LABELS[nextChar];
    turnLabelEl.textContent = '轮到' + FAMILY_LABELS[nextChar];
  } else {
    turnAvatarEl.src = 'resources/wolf.png';
    turnAvatarEl.alt = '狼';
    turnLabelEl.textContent = '轮到狼';
  }
}

/* ===== Victory ===== */
function showVictory(winner) {
  gameOver = true;
  const representative = (winner === 'family') ? 'jojo' : 'wolf';
  victoryAvatarEl.src = 'resources/' + representative + '.png';
  victoryAvatarEl.alt = (winner === 'family') ? '家人' : '狼';
  victoryTextEl.textContent = (winner === 'family') ? '家人赢啦！' : '狼赢啦！';
  victoryOverlayEl.hidden = false;
  setUndoEnabled(false);
}

function showDraw() {
  gameOver = true;
  victoryAvatarEl.src = 'resources/jojo.png';
  victoryAvatarEl.alt = '平局';
  victoryTextEl.textContent = '平局！棋盘下满啦~';
  victoryOverlayEl.hidden = false;
  setUndoEnabled(false);
}

function hideVictory() {
  victoryOverlayEl.hidden = true;
}

function setUndoEnabled(enabled) {
  const undoBtn = document.querySelector('.undo-btn');
  if (!undoBtn) return;
  undoBtn.disabled = !enabled;
  if (enabled) {
    undoBtn.classList.remove('disabled');
  } else {
    undoBtn.classList.add('disabled');
  }
}

/* ===== Board Init / Rebuild ===== */
function rebuildBoard() {
  boardEl.innerHTML = '';
  boardEl.style.setProperty('--board-size', String(BOARD_SIZE));
  cellNodes = [];

  // Grid lines as inline SVG. viewBox 0 0 100 100 = percentage space; lines
  // at pad% + i*step% of total-size align exactly with cell centers (both
  // use the same pad + col*spacing math). non-scaling-stroke keeps 1.5px.
  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('class', 'board-grid');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  const padPct = 4;
  const innerPct = 100 - padPct * 2;
  const stepPct = innerPct / (BOARD_SIZE - 1);
  for (let i = 0; i < BOARD_SIZE; i++) {
    const p = padPct + i * stepPct;
    const v = document.createElementNS(svgNs, 'line');
    v.setAttribute('x1', String(p));
    v.setAttribute('y1', String(padPct));
    v.setAttribute('x2', String(p));
    v.setAttribute('y2', String(padPct + innerPct));
    svg.appendChild(v);
    const h = document.createElementNS(svgNs, 'line');
    h.setAttribute('x1', String(padPct));
    h.setAttribute('y1', String(p));
    h.setAttribute('x2', String(padPct + innerPct));
    h.setAttribute('y2', String(p));
    svg.appendChild(h);
  }
  boardEl.appendChild(svg);

  // Intersection cells. size == spacing means cells tile the play area with
  // no overlap/gap; each cell center lands exactly on a line crossing.
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = String(r);
      cell.dataset.col = String(c);
      cell.style.setProperty('--row', String(r));
      cell.style.setProperty('--col', String(c));
      attachCellPointerHandlers(cell);
      boardEl.appendChild(cell);
      cellNodes.push(cell);
    }
  }

  if (typeof clearHints === 'function') {
    try { clearHints(); } catch (e) { /* ignore */ }
  }
  if (typeof rebindHintCells === 'function') {
    try { rebindHintCells(); } catch (e) { /* ignore */ }
  }
}

/* ===== Pointer Handlers (palm rejection + immediate feedback) ===== */
function attachCellPointerHandlers(cell) {
  cell.addEventListener('pointerdown', function (e) {
    lastPointerType = e.pointerType;
    if (gameOver) return;
    // Palm rejection: only the first pointer is honored.
    if (activePointerId !== null) return;
    activePointerId = e.pointerId;
    pointerStartCoords = { x: e.clientX, y: e.clientY };
    pointerCancelled = false;
    cell.classList.add('pressed');
  });

  cell.addEventListener('pointermove', function (e) {
    if (e.pointerId !== activePointerId) return;
    if (!pointerStartCoords) return;
    const dx = e.clientX - pointerStartCoords.x;
    const dy = e.clientY - pointerStartCoords.y;
    if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
      // Treated as a drag — cancel the press.
      cell.classList.remove('pressed');
      pointerCancelled = true;
      activePointerId = null;
      pointerStartCoords = null;
    }
  });

  cell.addEventListener('pointerup', function (e) {
    if (e.pointerId !== activePointerId) return;
    cell.classList.remove('pressed');
    const wasCancelled = pointerCancelled;
    activePointerId = null;
    pointerStartCoords = null;
    pointerCancelled = false;
    if (wasCancelled) return;
    if (gameOver) return;
    const row = parseInt(cell.dataset.row, 10);
    const col = parseInt(cell.dataset.col, 10);
    placeStone(row, col);
  });

  cell.addEventListener('pointercancel', function (e) {
    if (e.pointerId !== activePointerId) return;
    cell.classList.remove('pressed');
    activePointerId = null;
    pointerStartCoords = null;
    pointerCancelled = false;
  });

  cell.addEventListener('pointerleave', function (e) {
    if (e.pointerId !== activePointerId) return;
    cell.classList.remove('pressed');
    activePointerId = null;
    pointerStartCoords = null;
    pointerCancelled = true;
  });

  // Defensive: block context menu (long-press on iOS / right-click on desktop).
  cell.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });
}

/* ===== Init ===== */
function init() {
  boardEl = document.querySelector('.board');
  turnAvatarEl = document.querySelector('.turn-avatar');
  turnLabelEl = document.querySelector('.turn-label');
  victoryOverlayEl = document.querySelector('.victory-overlay');
  victoryAvatarEl = document.querySelector('.victory-avatar');
  victoryTextEl = document.querySelector('.victory-text');

  if (typeof getBoardSize === 'function') {
    var savedSize = getBoardSize();
    if (savedSize === 9 || savedSize === 13 || savedSize === 15) BOARD_SIZE = savedSize;
  }
  rebuildBoard();
  resetGame();

  window.addEventListener('wuziqi:boardSizeChanged', function (e) {
    var detail = e && e.detail ? e.detail : {};
    var size = detail.size;
    if (size !== 9 && size !== 13 && size !== 15) return;
    BOARD_SIZE = size;
    rebuildBoard();
    resetGame();
  });

  document.querySelector('.undo-btn').addEventListener('click', undoLastMove);
  document.querySelector('.reset-btn').addEventListener('click', resetGame);
  document.querySelector('.play-again-btn').addEventListener('click', resetGame);

  if (typeof initAudio === 'function') {
    try { initAudio(); } catch (e) { /* ignore */ }
  }
  if (typeof initHints === 'function') {
    try { initHints(); } catch (e) { /* ignore */ }
  }
  if (typeof initSettings === 'function') {
    try { initSettings(); } catch (e) { /* ignore */ }
  }

  // Orientation / resize: refresh indicator (real SVG redraw belongs to Wave 2).
  window.addEventListener('resize', updateTurnIndicator);
  window.addEventListener('orientationchange', updateTurnIndicator);

  // Block drag-start on images globally (defensive).
  document.addEventListener('dragstart', function (e) {
    if (e.target && e.target.tagName === 'IMG') e.preventDefault();
  });
}

document.addEventListener('DOMContentLoaded', init);
