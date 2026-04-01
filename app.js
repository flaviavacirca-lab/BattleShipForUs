// app.js — Main application controller for Battleship Date Night

let game;
let questionEngine;
let currentQuestion = null;
let currentDiceRoll = null;
let currentLevel = null;
let currentDefender = null;
let soundEnabled = true;
let isFirstTurn = true; // Skip handoff screen on very first turn

// Audio context for sound effects
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, duration, type = "sine", volume = 0.15) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) { /* audio not available */ }
}

function playHitSound() { playTone(520, 0.2, "square", 0.1); setTimeout(() => playTone(680, 0.15, "square", 0.08), 100); }
function playMissSound() { playTone(200, 0.3, "sine", 0.08); }
function playSunkSound() { playTone(440, 0.1, "square", 0.12); setTimeout(() => playTone(550, 0.1, "square", 0.12), 120); setTimeout(() => playTone(660, 0.15, "square", 0.12), 240); setTimeout(() => playTone(880, 0.25, "square", 0.15), 360); }
function playDiceSound() { for (let i = 0; i < 5; i++) setTimeout(() => playTone(300 + Math.random() * 400, 0.05, "triangle", 0.1), i * 60); }

// Initialize the game
function init() {
  game = new BattleshipGame();
  questionEngine = new QuestionEngine();
  isFirstTurn = true;
  renderBoards();
  updateTurnIndicator();
  updateShipStatus();
  updateStats();
  document.getElementById("game-over-overlay").classList.add("hidden");
  document.getElementById("question-modal").classList.add("hidden");
  document.getElementById("handoff-screen").classList.add("hidden");
}

// Render both boards
function renderBoards() {
  // Each player sees their own ships but not the opponent's
  renderBoard("board-d", game.boardD, game.currentPlayer !== "D");
  renderBoard("board-f", game.boardF, game.currentPlayer !== "F");
  highlightActiveBoard();
}

function renderBoard(containerId, board, hideShips) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  // Column headers
  const headerRow = document.createElement("div");
  headerRow.className = "grid-row header-row";
  headerRow.innerHTML = '<div class="grid-cell corner"></div>';
  for (let c = 0; c < BOARD_SIZE; c++) {
    headerRow.innerHTML += `<div class="grid-cell header">${c + 1}</div>`;
  }
  container.appendChild(headerRow);

  for (let r = 0; r < BOARD_SIZE; r++) {
    const row = document.createElement("div");
    row.className = "grid-row";
    row.innerHTML = `<div class="grid-cell header">${String.fromCharCode(65 + r)}</div>`;
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.dataset.row = r;
      cell.dataset.col = c;

      const val = board.grid[r][c];
      if (val === CELL_HIT) {
        cell.classList.add("hit");
        cell.innerHTML = '<span class="marker">💥</span>';
      } else if (val === CELL_MISS) {
        cell.classList.add("miss");
        cell.innerHTML = '<span class="marker">•</span>';
      } else if (val === CELL_SUNK) {
        cell.classList.add("sunk");
        cell.innerHTML = '<span class="marker">🔥</span>';
      } else if (val === CELL_SHIP && !hideShips) {
        cell.classList.add("ship");
      }

      // Only allow clicking on the opponent's board
      const isTargetBoard =
        (game.currentPlayer === "D" && containerId === "board-f") ||
        (game.currentPlayer === "F" && containerId === "board-d");

      if (isTargetBoard && game.phase === "playing" && val !== CELL_HIT && val !== CELL_MISS && val !== CELL_SUNK) {
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
  if (game.currentPlayer === "D") {
    dSection.classList.remove("active-target");
    fSection.classList.add("active-target");
    document.querySelector("#section-d .board-label").textContent = "D's Fleet (yours)";
    document.querySelector("#section-f .board-label").textContent = "F's Fleet — tap to fire!";
  } else {
    fSection.classList.remove("active-target");
    dSection.classList.add("active-target");
    document.querySelector("#section-f .board-label").textContent = "F's Fleet (yours)";
    document.querySelector("#section-d .board-label").textContent = "D's Fleet — tap to fire!";
  }
}

function updateTurnIndicator() {
  const indicator = document.getElementById("turn-indicator");
  indicator.textContent = `${game.currentPlayer}'s Turn`;
  indicator.className = "turn-indicator turn-" + game.currentPlayer.toLowerCase();
}

function updateShipStatus() {
  // Only show detailed hit counts for your own ships
  updateShipList("ships-d", game.boardD, game.currentPlayer === "D");
  updateShipList("ships-f", game.boardF, game.currentPlayer === "F");
}

function updateShipList(containerId, board, showDamage) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  board.ships.forEach(ship => {
    const el = document.createElement("div");
    const isSunk = ship.hits === ship.size;
    el.className = "ship-status" + (isSunk ? " sunk" : "");
    if (showDamage || isSunk) {
      // Show hit pips for your own ships or sunk ships (sunk is public info)
      const pips = Array.from({ length: ship.size }, (_, i) =>
        `<span class="pip ${i < ship.hits ? "pip-hit" : ""}"></span>`
      ).join("");
      el.innerHTML = `<span class="ship-name">${ship.name}</span><span class="pips">${pips}</span>`;
    } else {
      // Opponent's unsunk ships — show name and size but not damage
      const pips = Array.from({ length: ship.size }, () =>
        `<span class="pip"></span>`
      ).join("");
      el.innerHTML = `<span class="ship-name">${ship.name}</span><span class="pips">${pips}</span>`;
    }
    container.appendChild(el);
  });
}

// Handle an attack
function handleAttack(row, col) {
  if (game.phase !== "playing") return;

  const result = game.attack(row, col);
  if (!result) return;

  renderBoards();
  updateShipStatus();

  if (result.gameOver) {
    playSunkSound();
    showGameOver(result.winner);
    return;
  }

  if (result.sunkShip) {
    playSunkSound();
    showMessage(`${result.sunkShip} sunk!`, "sunk");
  } else if (result.result === "hit") {
    playHitSound();
    showMessage("Hit!", "hit");
  } else {
    playMissSound();
    showMessage("Miss", "miss");
  }

  if (result.triggerQuestion) {
    // Delay to let the hit register visually, then show question
    setTimeout(() => triggerQuestion(result.defender), 800);
  } else {
    // Miss — show handoff screen before next turn
    setTimeout(() => showHandoff(), 600);
  }
}

// Pass-and-play handoff screen
function showHandoff() {
  const screen = document.getElementById("handoff-screen");
  const nextPlayer = game.currentPlayer;
  document.getElementById("handoff-player").textContent = nextPlayer;
  document.getElementById("handoff-player").className = "handoff-name handoff-" + nextPlayer.toLowerCase();
  screen.classList.remove("hidden");
}

function dismissHandoff() {
  document.getElementById("handoff-screen").classList.add("hidden");
  renderBoards();
  updateTurnIndicator();
  updateShipStatus();
}

// Show a brief floating message
function showMessage(text, type) {
  const msg = document.getElementById("float-message");
  msg.textContent = text;
  msg.className = "float-message show " + type;
  setTimeout(() => msg.classList.remove("show"), 1200);
}

// Trigger question flow
function triggerQuestion(defender) {
  currentDefender = defender;
  currentDiceRoll = Math.floor(Math.random() * 6) + 1;
  currentLevel = diceToLevel(currentDiceRoll);

  playDiceSound();
  showDiceAnimation(currentDiceRoll, () => {
    showQuestion();
  });
}

function showDiceAnimation(roll, callback) {
  const modal = document.getElementById("question-modal");
  const content = document.getElementById("modal-content-inner");
  modal.classList.remove("hidden");

  const diceFrames = ["\u2680", "\u2681", "\u2682", "\u2683", "\u2684", "\u2685"];
  const finalDice = diceFrames[roll - 1];

  content.innerHTML = `
    <div class="dice-animation">
      <div class="dice-rolling" id="dice-display">${finalDice}</div>
      <div class="dice-label">Rolling...</div>
    </div>
  `;

  const diceEl = document.getElementById("dice-display");
  let frame = 0;
  const interval = setInterval(() => {
    diceEl.textContent = diceFrames[Math.floor(Math.random() * 6)];
    frame++;
    if (frame > 12) {
      clearInterval(interval);
      diceEl.textContent = finalDice;
      diceEl.classList.add("dice-final");
      document.querySelector(".dice-label").textContent = `Rolled a ${roll}!`;
      setTimeout(callback, 800);
    }
  }, 80);
}

function showQuestion() {
  const question = questionEngine.pickQuestion(currentDefender, currentLevel);
  currentQuestion = question;

  const modal = document.getElementById("question-modal");
  const content = document.getElementById("modal-content-inner");
  const levelInfo = LEVEL_INFO[currentLevel];

  if (!question) {
    content.innerHTML = `
      <div class="question-container">
        <div class="question-header">
          <span class="dice-result">\ud83c\udfb2 ${currentDiceRoll}</span>
          <span class="level-badge" style="background:${levelInfo.color}">${levelInfo.emoji} Level ${currentLevel}: ${levelInfo.name}</span>
        </div>
        <div class="question-exhausted">
          <p>\ud83c\udf89 ${currentDefender} has answered all Level ${currentLevel} questions!</p>
          <p>Amazing progress!</p>
        </div>
        <div class="question-actions">
          <button class="btn btn-reset-level" onclick="resetLevelAndRetry()">Reset Level ${currentLevel} for ${currentDefender}</button>
          <button class="btn btn-skip" onclick="dismissQuestion()">Skip This Round</button>
        </div>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div class="question-container">
      <div class="question-header">
        <span class="dice-result">\ud83c\udfb2 ${currentDiceRoll}</span>
        <span class="level-badge" style="background:${levelInfo.color}">${levelInfo.emoji} Level ${currentLevel}: ${levelInfo.name}</span>
      </div>
      <div class="question-responder">
        <span class="responder-name">${currentDefender}</span> is answering
      </div>
      <div class="question-text">\u201c${question.text}\u201d</div>
      <div class="question-note">This will be saved for <strong>${currentDefender}</strong>\u2019s profile</div>
      <div class="question-actions">
        <button class="btn btn-answered" onclick="markAnswered()">\u2713 Answered</button>
        <button class="btn btn-not-answered" onclick="markNotAnswered()">\u2717 Not Answered</button>
        <button class="btn btn-skip" onclick="skipQuestion()">\u21bb Skip Question</button>
      </div>
    </div>
  `;
}

function markAnswered() {
  if (currentQuestion && currentDefender) {
    questionEngine.markAnswered(currentDefender, currentQuestion.id);
  }
  dismissQuestion();
  updateStats();
}

function markNotAnswered() {
  dismissQuestion();
}

function skipQuestion() {
  // Show another question from the same level (dice roll stays the same)
  showQuestion();
}

function resetLevelAndRetry() {
  questionEngine.resetPlayerLevel(currentDefender, currentLevel);
  showQuestion();
  updateStats();
}

function dismissQuestion() {
  document.getElementById("question-modal").classList.add("hidden");
  game.questionDone();
  // After question, show handoff screen for the next player
  showHandoff();
}

// Game over
function showGameOver(winner) {
  renderBoard("board-d", game.boardD, false);
  renderBoard("board-f", game.boardF, false);
  document.querySelector("#section-d .board-label").textContent = "D's Fleet";
  document.querySelector("#section-f .board-label").textContent = "F's Fleet";
  const overlay = document.getElementById("game-over-overlay");
  overlay.classList.remove("hidden");
  document.getElementById("winner-text").textContent = `${winner} wins!`;
}

// Stats panel
function updateStats() {
  renderPlayerStats("stats-d", "D");
  renderPlayerStats("stats-f", "F");
}

function renderPlayerStats(containerId, player) {
  const container = document.getElementById(containerId);
  const stats = questionEngine.getStats(player);
  container.innerHTML = "";
  for (let level = 1; level <= 4; level++) {
    const s = stats[level];
    const info = LEVEL_INFO[level];
    const pct = s.total > 0 ? Math.round((s.answered / s.total) * 100) : 0;
    container.innerHTML += `
      <div class="stat-row">
        <span class="stat-label" style="color:${info.color}">${info.emoji} L${level}</span>
        <div class="stat-bar-bg">
          <div class="stat-bar-fill" style="width:${pct}%;background:${info.color}"></div>
        </div>
        <span class="stat-count">${s.answered}/${s.total}</span>
      </div>
    `;
  }
}

// Settings / Reset controls
function resetPlayerD() {
  if (confirm("Reset all answered questions for D?")) {
    questionEngine.resetPlayer("D");
    updateStats();
  }
}

function resetPlayerF() {
  if (confirm("Reset all answered questions for F?")) {
    questionEngine.resetPlayer("F");
    updateStats();
  }
}

function resetAllProgress() {
  if (confirm("Reset ALL answered questions for both D and F?")) {
    questionEngine.resetAll();
    updateStats();
  }
}

function newGame() {
  if (confirm("Start a new game? (Question progress is kept)")) {
    init();
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById("sound-toggle");
  btn.textContent = soundEnabled ? "\ud83d\udd0a" : "\ud83d\udd07";
}

function toggleHelp() {
  const panel = document.getElementById("help-panel");
  panel.classList.toggle("hidden");
}

// Start
document.addEventListener("DOMContentLoaded", init);
