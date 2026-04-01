// game.js — Core Battleship game logic

const BOARD_SIZE = 10;
const SHIPS = [
  { name: "Carrier", size: 5 },
  { name: "Battleship", size: 4 },
  { name: "Cruiser", size: 3 },
  { name: "Submarine", size: 3 },
  { name: "Destroyer", size: 2 },
];

const CELL_EMPTY = 0;
const CELL_SHIP = 1;
const CELL_HIT = 2;
const CELL_MISS = 3;
const CELL_SUNK = 4;

class Board {
  constructor() {
    this.grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(CELL_EMPTY));
    this.ships = [];
  }

  // Place a ship on the board
  placeShip(ship, row, col, horizontal) {
    const cells = [];
    for (let i = 0; i < ship.size; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      if (r >= BOARD_SIZE || c >= BOARD_SIZE || this.grid[r][c] !== CELL_EMPTY) {
        return false;
      }
      cells.push({ r, c });
    }
    cells.forEach(({ r, c }) => (this.grid[r][c] = CELL_SHIP));
    this.ships.push({ ...ship, cells, hits: 0 });
    return true;
  }

  // Auto-place all ships randomly
  autoPlace() {
    this.grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(CELL_EMPTY));
    this.ships = [];
    for (const ship of SHIPS) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 1000) {
        const horizontal = Math.random() < 0.5;
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);
        placed = this.placeShip(ship, row, col, horizontal);
        attempts++;
      }
    }
  }

  // Attack a cell, returns { result: 'hit'|'miss'|'already', sunkShip: shipName|null }
  attack(row, col) {
    const cell = this.grid[row][col];
    if (cell === CELL_HIT || cell === CELL_MISS || cell === CELL_SUNK) {
      return { result: "already", sunkShip: null };
    }
    if (cell === CELL_SHIP) {
      this.grid[row][col] = CELL_HIT;
      // Check if a ship was sunk
      for (const ship of this.ships) {
        if (ship.cells.some(c => c.r === row && c.c === col)) {
          ship.hits++;
          if (ship.hits === ship.size) {
            // Mark all cells as sunk
            ship.cells.forEach(({ r, c }) => (this.grid[r][c] = CELL_SUNK));
            return { result: "hit", sunkShip: ship.name };
          }
          break;
        }
      }
      return { result: "hit", sunkShip: null };
    }
    // Miss
    this.grid[row][col] = CELL_MISS;
    return { result: "miss", sunkShip: null };
  }

  // Check if all ships are sunk
  allSunk() {
    return this.ships.length > 0 && this.ships.every(s => s.hits === s.size);
  }
}

// Game state manager
class BattleshipGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.boardD = new Board();
    this.boardF = new Board();
    this.boardD.autoPlace();
    this.boardF.autoPlace();
    this.currentPlayer = "D"; // D goes first
    this.phase = "playing"; // 'playing' | 'question' | 'gameover'
    this.winner = null;
    this.lastAttackResult = null;
  }

  // Get the board being attacked (opponent's board)
  getTargetBoard() {
    return this.currentPlayer === "D" ? this.boardF : this.boardD;
  }

  // Get the current player's own board
  getOwnBoard() {
    return this.currentPlayer === "D" ? this.boardD : this.boardF;
  }

  // Get the defending player (whose ship gets hit)
  getDefender() {
    return this.currentPlayer === "D" ? "F" : "D";
  }

  // Make an attack
  attack(row, col) {
    if (this.phase !== "playing") return null;

    const targetBoard = this.getTargetBoard();
    const result = targetBoard.attack(row, col);

    if (result.result === "already") return null;

    this.lastAttackResult = result;

    if (result.result === "hit") {
      // Check for game over
      if (targetBoard.allSunk()) {
        this.phase = "gameover";
        this.winner = this.currentPlayer;
        return { ...result, gameOver: true, winner: this.currentPlayer };
      }
      // A hit triggers a question
      this.phase = "question";
      return { ...result, gameOver: false, triggerQuestion: true, defender: this.getDefender() };
    }

    // Miss — switch turns
    this.switchTurn();
    return { ...result, gameOver: false, triggerQuestion: false };
  }

  // After question is handled, switch turns
  questionDone() {
    this.phase = "playing";
    this.switchTurn();
  }

  switchTurn() {
    this.currentPlayer = this.currentPlayer === "D" ? "F" : "D";
  }
}
