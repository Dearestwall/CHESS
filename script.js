/***************************************************************
 * script.js - Enhanced offline Chess game with:
 * - Home screen for player name entry, mode selection (Human vs Human / Human vs Computer),
 *   side selection for computer mode, and option to rename Computer.
 * - Responsive 8x8 chess board with 3D animations.
 * - Detailed scoreboard: displays each player's name, points scored (from captured pieces),
 *   and matches won.
 * - Basic move validation with legal move highlighting.
 * - Random legal move AI for computer mode.
 * - Winner announcement via text and speech synthesis.
 * - Multiple themes (6 total) via a theme toggle.
 * - Background music.
 * - Polished UI with a footer.
 ***************************************************************/

/* -------------------- Global Variables -------------------- */
const boardElement = document.getElementById("board");
const turnDisplay = document.getElementById("turnDisplay");
const gameMessage = document.getElementById("gameMessage");
const restartBtn = document.getElementById("restartBtn");
const backHomeBtn = document.getElementById("backHomeBtn");
const homeScreen = document.getElementById("homeScreen");
const chessScreen = document.getElementById("chessScreen");
const startGameBtn = document.getElementById("startGameBtn");
const themeToggleBtn = document.getElementById("themeToggle");
const bgMusic = document.getElementById("bgMusic");
const scoreboardDiv = document.getElementById("scoreboard");

let gameMode = "human"; // "human" or "computer"
let boardState = []; // 8x8 board
let selectedCell = null;
let currentTurn = "w"; // "w" for White, "b" for Black
let gameActive = true;
let playerNames = { w: "White", b: "Black" };
let scoreData = { w: { points: 0, matches: 0 }, b: { points: 0, matches: 0 } };

/* Piece symbols */
const symbols = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟︎"
};

/* Piece values for scoring */
const pieceValues = {
  P: 1, N: 3, B: 3, R: 5, Q: 9
};

/* Themes Array: 6 themes */
const themesArray = ["dark", "light", "blue", "green", "purple", "red"];
let currentThemeIndex = 0;

/* -------------------- Initialization -------------------- */
function initGame() {
  initBoardState();
  drawBoard();
  currentTurn = "w";
  gameActive = true;
  scoreData.w.points = 0;
  scoreData.b.points = 0;
  updateTurnDisplay();
  updateScoreboard();
  gameMessage.innerText = "";
  selectedCell = null;
}

function initBoardState() {
  boardState = [
    ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
    ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
    ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"]
  ];
}

function drawBoard() {
  boardElement.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = row;
      cell.dataset.col = col;
      if ((row + col) % 2 === 0) cell.classList.add("light");
      else cell.classList.add("dark");
      cell.addEventListener("click", handleCellClick);
      const piece = boardState[row][col];
      if (piece) {
        cell.innerText = symbols[piece];
        cell.style.color = piece[0] === "w" ? "#fff" : "#000";
      }
      boardElement.appendChild(cell);
    }
  }
}

/* -------------------- UI Updates -------------------- */
function updateTurnDisplay() {
  turnDisplay.innerText = "Turn: " + (currentTurn === "w" ? playerNames.w : playerNames.b);
  turnDisplay.style.border = "3px solid #000";
  turnDisplay.style.padding = "4px";
}

function updateScoreboard() {
  // Display scoreboard as: Player Name | Points: X | Matches Won: Y
  scoreboardDiv.innerHTML = "";
  for (let side in playerNames) {
    const div = document.createElement("div");
    div.innerText = `${playerNames[side]} | Points: ${scoreData[side].points} | Matches Won: ${scoreData[side].matches}`;
    scoreboardDiv.appendChild(div);
  }
}

function clearHighlights() {
  document.querySelectorAll(".cell").forEach(cell => {
    cell.classList.remove("selected", "legal");
  });
  selectedCell = null;
}

function getCell(row, col) {
  return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

/* -------------------- Move Handling -------------------- */
function handleCellClick(e) {
  if (!gameActive) return;
  const cell = e.currentTarget;
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const piece = boardState[row][col];

  if (selectedCell) {
    if (selectedCell.row === row && selectedCell.col === col) {
      clearHighlights();
      return;
    }
    const legalMoves = getLegalMoves(selectedCell.row, selectedCell.col);
    if (legalMoves.some(m => m.row === row && m.col === col)) {
      movePiece(selectedCell.row, selectedCell.col, row, col);
      clearHighlights();
      selectedCell = null;
      switchTurn();
      return;
    } else {
      if (piece && piece[0] === currentTurn) {
        clearHighlights();
        selectedCell = { row, col };
        highlightCell(row, col);
        highlightLegalMoves(getLegalMoves(row, col));
      }
    }
  } else {
    if (piece && piece[0] === currentTurn) {
      selectedCell = { row, col };
      highlightCell(row, col);
      highlightLegalMoves(getLegalMoves(row, col));
    }
  }
}

function highlightCell(row, col) {
  const cell = getCell(row, col);
  if (cell) cell.classList.add("selected");
}

function highlightLegalMoves(moves) {
  moves.forEach(m => {
    const cell = getCell(m.row, m.col);
    if (cell) cell.classList.add("legal");
  });
}

function movePiece(fromRow, fromCol, toRow, toCol) {
  const destPiece = boardState[toRow][toCol];
  // If capturing an opponent piece (and it's not a king), add points
  if (destPiece && destPiece[0] !== boardState[fromRow][fromCol][0]) {
    if (destPiece[1] === "K") {
      gameActive = false;
      const winner = boardState[fromRow][fromCol][0] === "w" ? playerNames.w : playerNames.b;
      gameMessage.innerText = winner + " wins by capturing the king!";
      speakWinner(winner);
      scoreData[boardState[fromRow][fromCol][0]].matches++;
      restartBtn.disabled = false;
    } else {
      // Add points based on piece value
      scoreData[boardState[fromRow][fromCol][0]].points += pieceValues[destPiece[1]] || 1;
    }
  }
  boardState[toRow][toCol] = boardState[fromRow][fromCol];
  boardState[fromRow][fromCol] = null;
  drawBoard();
  updateScoreboard();
}

function getLegalMoves(row, col) {
  const piece = boardState[row][col];
  if (!piece) return [];
  const type = piece[1];
  const color = piece[0];
  let moves = [];
  
  if (type === "P") {
    let dir = color === "w" ? -1 : 1;
    if (isOnBoard(row + dir, col) && !boardState[row + dir][col])
      moves.push({ row: row + dir, col });
    if (isOnBoard(row + dir, col - 1) && boardState[row + dir][col - 1] && boardState[row + dir][col - 1][0] !== color)
      moves.push({ row: row + dir, col: col - 1 });
    if (isOnBoard(row + dir, col + 1) && boardState[row + dir][col + 1] && boardState[row + dir][col + 1][0] !== color)
      moves.push({ row: row + dir, col: col + 1 });
  } else if (type === "N") {
    const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    deltas.forEach(d => {
      const r2 = row + d[0], c2 = col + d[1];
      if (isOnBoard(r2, c2) && (!boardState[r2][c2] || boardState[r2][c2][0] !== color))
        moves.push({ row: r2, col: c2 });
    });
  } else if (type === "B") {
    moves = moves.concat(slidingMoves(row, col, color, [[-1,-1],[-1,1],[1,-1],[1,1]]));
  } else if (type === "R") {
    moves = moves.concat(slidingMoves(row, col, color, [[-1,0],[1,0],[0,-1],[0,1]]));
  } else if (type === "Q") {
    moves = moves.concat(slidingMoves(row, col, color, [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]));
  } else if (type === "K") {
    const deltas = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    deltas.forEach(d => {
      const r2 = row + d[0], c2 = col + d[1];
      if (isOnBoard(r2, c2) && (!boardState[r2][c2] || boardState[r2][c2][0] !== color))
        moves.push({ row: r2, col: c2 });
    });
  }
  return moves;
}

function slidingMoves(row, col, color, directions) {
  let moves = [];
  directions.forEach(d => {
    let r = row + d[0], c = col + d[1];
    while (isOnBoard(r, c)) {
      if (!boardState[r][c]) {
        moves.push({ row: r, col: c });
      } else {
        if (boardState[r][c][0] !== color) moves.push({ row: r, col: c });
        break;
      }
      r += d[0];
      c += d[1];
    }
  });
  return moves;
}

function isOnBoard(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

/* -------------------- Turn & AI Handling -------------------- */
function switchTurn() {
  currentTurn = currentTurn === "w" ? "b" : "w";
  updateTurnDisplay();
  clearHighlights();
  if (gameMode === "computer" && currentTurn === "b" && gameActive) {
    setTimeout(computerMove, 500);
  }
}

function computerMove() {
  let moves = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = boardState[row][col];
      if (piece && piece[0] === "b") {
        const legal = getLegalMoves(row, col);
        legal.forEach(m => moves.push({ from: { row, col }, to: m }));
      }
    }
  }
  if (moves.length === 0) return;
  const move = moves[Math.floor(Math.random() * moves.length)];
  movePiece(move.from.row, move.from.col, move.to.row, move.to.col);
  switchTurn();
}

function updateTurnDisplay() {
  turnDisplay.innerText = "Turn: " + (currentTurn === "w" ? playerNames.w : playerNames.b);
}

/* -------------------- Speech Synthesis -------------------- */
function speakWinner(name) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(name + " wins the game!");
    window.speechSynthesis.speak(utterance);
  }
}

/* -------------------- Restart & Navigation -------------------- */
restartBtn.addEventListener("click", () => {
  initBoardState();
  drawBoard();
  currentTurn = "w";
  gameActive = true;
  gameMessage.innerText = "";
  updateTurnDisplay();
  clearHighlights();
});

backHomeBtn.addEventListener("click", () => {
  chessScreen.style.display = "none";
  homeScreen.style.display = "block";
});

/* -------------------- Home Screen Handling -------------------- */
document.getElementById("startGameBtn").addEventListener("click", () => {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  gameMode = mode;
  if (mode === "human") {
    const p1 = document.getElementById("player1Input").value.trim() || "White";
    const p2 = document.getElementById("player2Input").value.trim() || "Black";
    playerNames = { w: p1, b: p2 };
  } else {
    const p = document.getElementById("playerInput").value.trim() || "Player";
    const side = document.querySelector('input[name="side"]:checked').value;
    if (side === "w") {
      playerNames = { w: p, b: "Computer" };
    } else {
      playerNames = { w: "Computer", b: p };
    }
  }
  // Reset match scores if starting a new game session
  scoreData = { w: { points: 0, matches: 0 }, b: { points: 0, matches: 0 } };
  homeScreen.style.display = "none";
  chessScreen.style.display = "block";
  initGame();
  updateScoreboard();
});

/* -------------------- Theme Toggle & Background Music -------------------- */
themeToggleBtn.addEventListener("click", () => {
  currentThemeIndex = (currentThemeIndex + 1) % themesArray.length;
  document.body.dataset.theme = themesArray[currentThemeIndex];
});
bgMusic.volume = 0.5;

/* -------------------- Mode Selection UI -------------------- */
const modeRadios = document.getElementsByName("mode");
modeRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    if (radio.value === "computer") {
      document.getElementById("humanInputs").style.display = "none";
      document.getElementById("computerInput").style.display = "block";
      document.getElementById("sideSelection").style.display = "block";
    } else {
      document.getElementById("humanInputs").style.display = "block";
      document.getElementById("computerInput").style.display = "none";
      document.getElementById("sideSelection").style.display = "none";
    }
  });
});

/* -------------------- Initialization -------------------- */
initGame();
