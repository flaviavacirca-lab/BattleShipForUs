// app.js — Main application controller for Battleship Date Night (Multiplayer)

let game = null;
let questionEngine = null;
let localPlayer = null;   // "D" or "F"
let mp = null;             // MultiplayerManager
let soundEnabled = true;
let audioCtx = null;
let diceAnimationInterval = null;
let currentQuestionTrigger = null; // tracks which question trigger we've animated

// ═══════════════════════════════════════════════════════════
// AUDIO
// ═══════════════════════════════════════════════════════════

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, duration, type, volume) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    gain.gain.value = volume || 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) { /* audio not available */ }
}

function playHitSound()  { playTone(520, 0.2, "square", 0.1); setTimeout(() => playTone(680, 0.15, "square", 0.08), 100); }
function playMissSound() { playTone(200, 0.3, "sine", 0.08); }
function playSunkSound() { playTone(440, 0.1, "square", 0.12); setTimeout(() => playTone(550, 0.1, "square", 0.12), 120); setTimeout(() => playTone(660, 0.15, "square", 0.12), 240); setTimeout(() => playTone(880, 0.25, "square", 0.15), 360); }
function playDiceSound() { for (let i = 0; i < 5; i++) setTimeout(() => playTone(300 + Math.random() * 400, 0.05, "triangle", 0.1), i * 60); }

// ═══════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  mp = new MultiplayerManager();
  try {
    mp.init();
  } catch (e) {
    document.getElementById('lobby-error').textContent = e.message;
    showLobby();
    return;
  }

  // Try reconnecting to a previous session
  const reconnect = await mp.tryReconnect();
  if (reconnect) {
    localPlayer = reconnect.player;
    mp.subscribe(onRemoteStateUpdate);
    enterGame(reconnect.state);
  } else {
    showLobby();
  }
});

// ═══════════════════════════════════════════════════════════
// LOBBY
// ═══════════════════════════════════════════════════════════

function showLobby() {
  document.getElementById('lobby-screen').classList.remove('hidden');
  document.getElementById('game-screen').classList.add('hidden');
  // Reset lobby sub-sections
  document.getElementById('lobby-create-join').classList.remove('hidden');
  document.getElementById('lobby-room-info').classList.add('hidden');
  document.getElementById('lobby-role-selection').classList.add('hidden');
  document.getElementById('lobby-waiting').classList.add('hidden');
}

async function handleCreateRoom() {
  const btn = document.getElementById('btn-create');
  btn.disabled = true;
  btn.textContent = 'Creating...';
  try {
    const profiles = await mp.loadProfiles();
    const tempGame = new BattleshipGame();
    const initialState = {
      ...tempGame.serialize(),
      players: {},
      phase: 'waiting',
      questionState: null,
      answeredD: profiles.D,
      answeredF: profiles.F,
      lastAction: null
    };
    const roomId = await mp.createRoom(initialState);
    // Show room code and role selection
    document.getElementById('lobby-create-join').classList.add('hidden');
    document.getElementById('lobby-room-info').classList.remove('hidden');
    document.getElementById('display-room-code').textContent = roomId;
    showRoleSelection(initialState);
  } catch (e) {
    document.getElementById('lobby-error').textContent = e.message;
    btn.disabled = false;
    btn.textContent = 'Create Room';
  }
}

async function handleJoinRoom() {
  const input = document.getElementById('room-code-input');
  const code = input.value.trim().toUpperCase();
  if (!code) { input.focus(); return; }
  const btn = document.getElementById('btn-join');
  btn.disabled = true;
  btn.textContent = 'Joining...';
  try {
    const state = await mp.joinRoom(code);
    document.getElementById('lobby-create-join').classList.add('hidden');
    document.getElementById('lobby-room-info').classList.remove('hidden');
    document.getElementById('display-room-code').textContent = code;
    showRoleSelection(state);
  } catch (e) {
    document.getElementById('lobby-error').textContent = 'Room not found: ' + code;
    btn.disabled = false;
    btn.textContent = 'Join Room';
  }
}

function showRoleSelection(state) {
  const container = document.getElementById('lobby-role-selection');
  container.classList.remove('hidden');
  const players = (state && state.players) || {};
  const btnD = document.getElementById('role-btn-d');
  const btnF = document.getElementById('role-btn-f');
  const takenD = players.D && players.D !== mp.sessionId;
  const takenF = players.F && players.F !== mp.sessionId;
  btnD.disabled = takenD;
  btnF.disabled = takenF;
  btnD.textContent = takenD ? 'D (taken)' : 'Play as D';
  btnF.textContent = takenF ? 'F (taken)' : 'Play as F';
}

async function handleSelectRole(player) {
  const btn = document.getElementById(player === 'D' ? 'role-btn-d' : 'role-btn-f');
  btn.disabled = true;
  btn.textContent = 'Joining...';
  try {
    const success = await mp.claimRole(player);
    if (!success) {
      alert(player + ' is already taken!');
      btn.disabled = false;
      btn.textContent = 'Play as ' + player;
      return;
    }
    localPlayer = player;
    mp.subscribe(onRemoteStateUpdate);
    const state = mp.currentState;
    if (state.phase === 'playing' || state.phase === 'question' || state.phase === 'gameover') {
      enterGame(state);
    } else {
      document.getElementById('lobby-role-selection').classList.add('hidden');
      document.getElementById('lobby-waiting').classList.remove('hidden');
    }
  } catch (e) {
    alert('Error: ' + e.message);
    btn.disabled = false;
    btn.textContent = 'Play as ' + player;
  }
}

function enterGame(state) {
  document.getElementById('lobby-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
  // Show player badge
  const opponent = localPlayer === 'D' ? 'F' : 'D';
  document.getElementById('player-badge').textContent =
    'You are ' + localPlayer + '  \u00b7  Room: ' + mp.roomId + '  \u00b7  vs ' + opponent;
  questionEngine = new QuestionEngine();
  applyState(state);
}

// ═══════════════════════════════════════════════════════════
// REMOTE STATE HANDLING
// ═══════════════════════════════════════════════════════════

function onRemoteStateUpdate(state) {
  // If still in lobby, check if game started
  if (!document.getElementById('lobby-screen').classList.contains('hidden')) {
    if (state.phase !== 'waiting') {
      enterGame(state);
    } else {
      showRoleSelection(state);
    }
    return;
  }
  applyState(state);
}

function applyState(state) {
  // Rebuild game from serialized state
  game = BattleshipGame.fromState(state);

  // Sync question engine answered lists
  questionEngine.answered.D = state.answeredD || [];
  questionEngine.answered.F = state.answeredF || [];

  // Animate opponent's last action
  if (state.lastAction && state.lastAction.player !== localPlayer) {
    animateAction(state.lastAction);
  }

  // Render boards and UI
  renderBoards();
  updateTurnIndicator();
  updateShipStatus();
  updateStats();

  // Handle question state
  if (state.questionState && state.questionState.active) {
    handleQuestionState(state.questionState);
  } else {
    document.getElementById('question-modal').classList.add('hidden');
    currentQuestionTrigger = null;
  }

  // Handle game over
  if (state.phase === 'gameover') {
    showGameOver(state.winner);
  } else {
    document.getElementById('game-over-overlay').classList.add('hidden');
  }
}

function animateAction(action) {
  if (action.type === 'attack') {
    if (action.sunkShip) {
      playSunkSound();
      showMessage(action.sunkShip + ' sunk!', 'sunk');
    } else if (action.result === 'hit') {
      playHitSound();
      showMessage('Hit!', 'hit');
    } else {
      playMissSound();
      showMessage('Miss', 'miss');
    }
  }
}

// ═══════════════════════════════════════════════════════════
// BOARD RENDERING (adapted from original — uses localPlayer)
// ═══════════════════════════════════════════════════════════

function renderBoards() {
  // Each player always sees their own ships, never the opponent's
  renderBoard("board-d", game.boardD, localPlayer !== "D");
  renderBoard("board-f", game.boardF, localPlayer !== "F");
  highlightActiveBoard();
}

function renderBoard(containerId, board, hideShips) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const headerRow = document.createElement("div");
  headerRow.className = "grid-row header-row";
  headerRow.innerHTML = '<div class="grid-cell corner"></div>';
  for (let c = 0; c < BOARD_SIZE; c++) {
    headerRow.innerHTML += '<div class="grid-cell header">' + (c + 1) + '</div>';
  }
  container.appendChild(headerRow);

  for (let r = 0; r < BOARD_SIZE; r++) {
    const row = document.createElement("div");
    row.className = "grid-row";
    row.innerHTML = '<div class="grid-cell header">' + String.fromCharCode(65 + r) + '</div>';
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.dataset.row = r;
      cell.dataset.col = c;

      const val = board.grid[r][c];
      if (val === CELL_HIT) {
        cell.classList.add("hit");
        cell.innerHTML = '<span class="marker">\ud83d\udca5</span>';
      } else if (val === CELL_MISS) {
        cell.classList.add("miss");
        cell.innerHTML = '<span class="marker">\u2022</span>';
      } else if (val === CELL_SUNK) {
        cell.classList.add("sunk");
        cell.innerHTML = '<span class="marker">\ud83d\udd25</span>';
      } else if (val === CELL_SHIP && !hideShips) {
        cell.classList.add("ship");
      }

      // Only clickable if: it's the opponent's board, it's your turn, game is in playing phase
      const isTargetBoard =
        (localPlayer === "D" && containerId === "board-f") ||
        (localPlayer === "F" && containerId === "board-d");
      const isMyTurn = game.currentPlayer === localPlayer;

      if (isTargetBoard && isMyTurn && game.phase === "playing" &&
          val !== CELL_HIT && val !== CELL_MISS && val !== CELL_SUNK) {
        cell.classList.add("clickable");
        cell.addEventListener("click", () => handleAttack(r, c));
      }

      row.appendChild(cell);
    }
    container.appendChild(row);
  }
}

function highlightActiveBoard() {
  const dSection = document.getElementById("section-d");
  const fSection = document.getElementById("section-f");
  const isMyTurn = game.currentPlayer === localPlayer;

  if (localPlayer === "D") {
    dSection.classList.remove("active-target");
    fSection.classList.toggle("active-target", isMyTurn);
    document.querySelector("#section-d .board-label").textContent = "Your Fleet (D)";
    document.querySelector("#section-f .board-label").textContent =
      isMyTurn ? "F's Fleet \u2014 tap to fire!" : "F's Fleet";
  } else {
    fSection.classList.remove("active-target");
    dSection.classList.toggle("active-target", isMyTurn);
    document.querySelector("#section-f .board-label").textContent = "Your Fleet (F)";
    document.querySelector("#section-d .board-label").textContent =
      isMyTurn ? "D's Fleet \u2014 tap to fire!" : "D's Fleet";
  }
}

function updateTurnIndicator() {
  const indicator = document.getElementById("turn-indicator");
  const isMyTurn = game.currentPlayer === localPlayer;
  if (game.phase === 'gameover') {
    indicator.textContent = game.winner === localPlayer ? 'You won!' : game.winner + ' wins!';
  } else if (game.phase === 'question') {
    indicator.textContent = 'Question Time';
  } else if (isMyTurn) {
    indicator.textContent = 'Your Turn \u2014 Fire!';
  } else {
    indicator.textContent = 'Waiting for ' + game.currentPlayer + '...';
  }
  indicator.className = "turn-indicator turn-" + game.currentPlayer.toLowerCase();
}

function updateShipStatus() {
  updateShipList("ships-d", game.boardD, localPlayer === "D");
  updateShipList("ships-f", game.boardF, localPlayer === "F");
}

function updateShipList(containerId, board, showDamage) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  board.ships.forEach(function(ship) {
    const el = document.createElement("div");
    const isSunk = ship.hits === ship.size;
    el.className = "ship-status" + (isSunk ? " sunk" : "");
    const pips = Array.from({ length: ship.size }, function(_, i) {
      const isHit = (showDamage || isSunk) && i < ship.hits;
      return '<span class="pip ' + (isHit ? "pip-hit" : "") + '"></span>';
    }).join("");
    el.innerHTML = '<span class="ship-name">' + ship.name + '</span><span class="pips">' + pips + '</span>';
    container.appendChild(el);
  });
}

// ═══════════════════════════════════════════════════════════
// ATTACK HANDLING
// ═══════════════════════════════════════════════════════════

function handleAttack(row, col) {
  if (game.phase !== "playing") return;
  if (game.currentPlayer !== localPlayer) return;

  const defender = game.getDefender();
  const result = game.attack(row, col);
  if (!result) return;

  // Build updated state to push
  const state = Object.assign({}, mp.currentState, game.serialize(), {
    answeredD: questionEngine.answered.D,
    answeredF: questionEngine.answered.F,
    lastAction: {
      type: 'attack',
      player: localPlayer,
      row: row, col: col,
      result: result.result,
      sunkShip: result.sunkShip
    }
  });

  // If hit triggers a question, prepare question state
  if (result.triggerQuestion) {
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const level = diceToLevel(diceRoll);
    const question = questionEngine.pickQuestion(defender, level);
    state.questionState = {
      active: true,
      id: row + '_' + col + '_' + Date.now(),
      diceRoll: diceRoll,
      level: level,
      question: question,
      defender: defender
    };
  } else {
    state.questionState = null;
  }

  if (result.gameOver) {
    state.phase = 'gameover';
    state.winner = localPlayer;
    state.questionState = null;
  }

  // Instant local feedback
  renderBoards();
  updateShipStatus();

  if (result.sunkShip) {
    playSunkSound();
    showMessage(result.sunkShip + ' sunk!', 'sunk');
  } else if (result.result === 'hit') {
    playHitSound();
    showMessage('Hit!', 'hit');
  } else {
    playMissSound();
    showMessage('Miss', 'miss');
    updateTurnIndicator();
  }

  // Push to Supabase
  mp.pushState(state);

  // Show question locally if triggered
  if (result.triggerQuestion && state.questionState) {
    setTimeout(function() { handleQuestionState(state.questionState); }, 800);
  }

  if (result.gameOver) {
    showGameOver(localPlayer);
  }
}

// ═══════════════════════════════════════════════════════════
// QUESTION SYSTEM
// ═══════════════════════════════════════════════════════════

function handleQuestionState(qs) {
  // If same trigger id, it's a skip — update question directly, no dice animation
  if (currentQuestionTrigger === qs.id) {
    showQuestionFromState(qs);
    return;
  }
  // New question trigger — play dice animation
  currentQuestionTrigger = qs.id;
  playDiceSound();
  showDiceAnimation(qs.diceRoll, function() {
    showQuestionFromState(qs);
  });
}

function showDiceAnimation(roll, callback) {
  if (diceAnimationInterval) clearInterval(diceAnimationInterval);

  var modal = document.getElementById("question-modal");
  var content = document.getElementById("modal-content-inner");
  modal.classList.remove("hidden");

  var diceFrames = ["\u2680", "\u2681", "\u2682", "\u2683", "\u2684", "\u2685"];
  var finalDice = diceFrames[roll - 1];

  content.innerHTML =
    '<div class="dice-animation">' +
    '  <div class="dice-rolling" id="dice-display">' + finalDice + '</div>' +
    '  <div class="dice-label">Rolling...</div>' +
    '</div>';

  var diceEl = document.getElementById("dice-display");
  var frame = 0;
  diceAnimationInterval = setInterval(function() {
    diceEl.textContent = diceFrames[Math.floor(Math.random() * 6)];
    frame++;
    if (frame > 12) {
      clearInterval(diceAnimationInterval);
      diceAnimationInterval = null;
      diceEl.textContent = finalDice;
      diceEl.classList.add("dice-final");
      document.querySelector(".dice-label").textContent = 'Rolled a ' + roll + '!';
      setTimeout(callback, 800);
    }
  }, 80);
}

function showQuestionFromState(qs) {
  if (diceAnimationInterval) {
    clearInterval(diceAnimationInterval);
    diceAnimationInterval = null;
  }

  var modal = document.getElementById("question-modal");
  var content = document.getElementById("modal-content-inner");
  modal.classList.remove("hidden");

  var levelInfo = LEVEL_INFO[qs.level];
  var isDefender = localPlayer === qs.defender;

  if (!qs.question) {
    // All questions at this level exhausted
    content.innerHTML =
      '<div class="question-container">' +
      '  <div class="question-header">' +
      '    <span class="dice-result">\ud83c\udfb2 ' + qs.diceRoll + '</span>' +
      '    <span class="level-badge" style="background:' + levelInfo.color + '">' + levelInfo.emoji + ' Level ' + qs.level + ': ' + levelInfo.name + '</span>' +
      '  </div>' +
      '  <div class="question-exhausted">' +
      '    <p>\ud83c\udf89 ' + qs.defender + ' has answered all Level ' + qs.level + ' questions!</p>' +
      '    <p>Amazing progress!</p>' +
      '  </div>' +
      '  <div class="question-actions">' +
      (isDefender
        ? '    <button class="btn btn-reset-level" onclick="resetLevelAndRetry()">Reset Level ' + qs.level + ' for ' + qs.defender + '</button>' +
          '    <button class="btn btn-skip" onclick="dismissQuestion()">Skip This Round</button>'
        : '    <p class="waiting-text">Waiting for ' + qs.defender + ' to decide...</p>'
      ) +
      '  </div>' +
      '</div>';
    return;
  }

  content.innerHTML =
    '<div class="question-container">' +
    '  <div class="question-header">' +
    '    <span class="dice-result">\ud83c\udfb2 ' + qs.diceRoll + '</span>' +
    '    <span class="level-badge" style="background:' + levelInfo.color + '">' + levelInfo.emoji + ' Level ' + qs.level + ': ' + levelInfo.name + '</span>' +
    '  </div>' +
    '  <div class="question-responder">' +
    '    <span class="responder-name">' + qs.defender + '</span> is answering' +
    '  </div>' +
    '  <div class="question-text">\u201c' + qs.question.text + '\u201d</div>' +
    '  <div class="question-note">This will be saved for <strong>' + qs.defender + '</strong>\u2019s profile</div>' +
    '  <div class="question-actions">' +
    (isDefender
      ? '    <button class="btn btn-answered" onclick="markAnswered()">\u2713 Answered</button>' +
        '    <button class="btn btn-not-answered" onclick="markNotAnswered()">\u2717 Not Answered</button>' +
        '    <button class="btn btn-skip" onclick="skipQuestion()">\u21bb Skip Question</button>'
      : '    <p class="waiting-text">Waiting for ' + qs.defender + ' to respond...</p>'
    ) +
    '  </div>' +
    '</div>';
}

async function markAnswered() {
  var state = mp.currentState;
  var qs = state.questionState;
  if (!qs || !qs.question) return;

  // Update answered list
  var answeredKey = qs.defender === 'D' ? 'answeredD' : 'answeredF';
  if (!state[answeredKey].includes(qs.question.id)) {
    state[answeredKey].push(qs.question.id);
  }

  // Persist to profiles table
  try { await mp.saveProfile(qs.defender, state[answeredKey]); } catch(e) { /* best effort */ }

  // Clear question state, switch turn
  state.questionState = null;
  state.phase = 'playing';
  state.currentPlayer = state.currentPlayer === 'D' ? 'F' : 'D';
  state.lastAction = null;

  currentQuestionTrigger = null;
  document.getElementById('question-modal').classList.add('hidden');
  mp.pushState(state);
}

async function markNotAnswered() {
  var state = mp.currentState;

  state.questionState = null;
  state.phase = 'playing';
  state.currentPlayer = state.currentPlayer === 'D' ? 'F' : 'D';
  state.lastAction = null;

  currentQuestionTrigger = null;
  document.getElementById('question-modal').classList.add('hidden');
  mp.pushState(state);
}

async function skipQuestion() {
  var state = mp.currentState;
  var qs = state.questionState;
  if (!qs) return;

  // Pick new question at same level (same dice, same level)
  questionEngine.answered[qs.defender] = state[qs.defender === 'D' ? 'answeredD' : 'answeredF'];
  var newQuestion = questionEngine.pickQuestion(qs.defender, qs.level);

  state.questionState = Object.assign({}, qs, { question: newQuestion });
  // Keep same trigger id so handleQuestionState skips the dice animation
  mp.pushState(state);

  // Show updated question locally immediately
  showQuestionFromState(state.questionState);
}

async function resetLevelAndRetry() {
  var state = mp.currentState;
  var qs = state.questionState;
  if (!qs) return;

  var answeredKey = qs.defender === 'D' ? 'answeredD' : 'answeredF';
  var levelIds = QUESTION_BANK[qs.level].map(function(q) { return q.id; });
  state[answeredKey] = state[answeredKey].filter(function(id) { return !levelIds.includes(id); });

  // Persist reset to profiles
  try { await mp.saveProfile(qs.defender, state[answeredKey]); } catch(e) {}

  // Pick a fresh question
  questionEngine.answered[qs.defender] = state[answeredKey];
  var newQuestion = questionEngine.pickQuestion(qs.defender, qs.level);
  state.questionState = Object.assign({}, qs, { question: newQuestion });

  mp.pushState(state);
  showQuestionFromState(state.questionState);
  updateStats();
}

function dismissQuestion() {
  // Used when skipping an exhausted question round
  markNotAnswered();
}

// ═══════════════════════════════════════════════════════════
// GAME OVER
// ═══════════════════════════════════════════════════════════

function showGameOver(winner) {
  // Reveal all ships
  renderBoard("board-d", game.boardD, false);
  renderBoard("board-f", game.boardF, false);
  document.querySelector("#section-d .board-label").textContent = "D's Fleet";
  document.querySelector("#section-f .board-label").textContent = "F's Fleet";
  var overlay = document.getElementById("game-over-overlay");
  overlay.classList.remove("hidden");
  document.getElementById("winner-text").textContent =
    winner === localPlayer ? 'You won! \ud83c\udf89' : winner + ' wins!';
}

// ═══════════════════════════════════════════════════════════
// UI UTILITIES
// ═══════════════════════════════════════════════════════════

function showMessage(text, type) {
  var msg = document.getElementById("float-message");
  msg.textContent = text;
  msg.className = "float-message show " + type;
  setTimeout(function() { msg.classList.remove("show"); }, 1200);
}

function updateStats() {
  renderPlayerStats("stats-d", "D");
  renderPlayerStats("stats-f", "F");
}

function renderPlayerStats(containerId, player) {
  var container = document.getElementById(containerId);
  var stats = questionEngine.getStats(player);
  container.innerHTML = "";
  for (var level = 1; level <= 4; level++) {
    var s = stats[level];
    var info = LEVEL_INFO[level];
    var pct = s.total > 0 ? Math.round((s.answered / s.total) * 100) : 0;
    container.innerHTML +=
      '<div class="stat-row">' +
      '  <span class="stat-label" style="color:' + info.color + '">' + info.emoji + ' L' + level + '</span>' +
      '  <div class="stat-bar-bg"><div class="stat-bar-fill" style="width:' + pct + '%;background:' + info.color + '"></div></div>' +
      '  <span class="stat-count">' + s.answered + '/' + s.total + '</span>' +
      '</div>';
  }
}

// ═══════════════════════════════════════════════════════════
// SETTINGS / CONTROLS
// ═══════════════════════════════════════════════════════════

async function resetPlayerD() {
  if (!confirm('Reset all answered questions for D?')) return;
  var state = mp.currentState;
  state.answeredD = [];
  try { await mp.saveProfile('D', []); } catch(e) {}
  mp.pushState(state);
}

async function resetPlayerF() {
  if (!confirm('Reset all answered questions for F?')) return;
  var state = mp.currentState;
  state.answeredF = [];
  try { await mp.saveProfile('F', []); } catch(e) {}
  mp.pushState(state);
}

async function resetAllProgress() {
  if (!confirm('Reset ALL answered questions for both D and F?')) return;
  var state = mp.currentState;
  state.answeredD = [];
  state.answeredF = [];
  try {
    await mp.saveProfile('D', []);
    await mp.saveProfile('F', []);
  } catch(e) {}
  mp.pushState(state);
}

async function newGame() {
  if (!confirm('Start a new game? (Question progress is kept)')) return;
  var tempGame = new BattleshipGame();
  var state = Object.assign({}, mp.currentState, tempGame.serialize(), {
    phase: 'playing',
    winner: null,
    questionState: null,
    lastAction: null
  });
  mp.pushState(state);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  document.getElementById("sound-toggle").textContent = soundEnabled ? "\ud83d\udd0a" : "\ud83d\udd07";
}

function toggleHelp() {
  document.getElementById("help-panel").classList.toggle("hidden");
}

function leaveRoom() {
  if (!confirm('Leave this room?')) return;
  localStorage.removeItem('bdn_room_id');
  localStorage.removeItem('bdn_player');
  mp.disconnect();
  location.reload();
}
