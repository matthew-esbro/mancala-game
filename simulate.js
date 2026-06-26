// Mancala Simulation: Trainer vs CPU at all levels, going first and second.
// The engine is extracted from www/index.html (script id="game-engine") so the
// simulation always exercises the exact rules + AI code the app ships.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'www', 'index.html'), 'utf8');
const match = html.match(/<script id="game-engine"[^>]*>([\s\S]*?)<\/script>/);
if (!match) {
  console.error('game-engine script block not found in www/index.html');
  process.exit(1);
}
const E = new Function(match[1] +
  '\nreturn { initBoard, getValidMoves, sowResult, isGameOver, finalizeBoard, getWinner, cpuMove, minimax };')();

function simulateGame(cpuLevel, trainerGoesFirst) {
  let board = E.initBoard();
  let currentPlayer = trainerGoesFirst ? 0 : 1;
  let moveCount = 0;

  while (!E.isGameOver(board) && moveCount < 200) {
    // The trainer plays the same full-depth search as the Counter CPU.
    const level = currentPlayer === 0 ? 'counter' : cpuLevel;
    const move = E.cpuMove(board, currentPlayer, level);
    if (move < 0) break;
    const { finalBoard, extraTurn } = E.sowResult(board, move, currentPlayer);
    board = finalBoard;
    moveCount++;
    if (!extraTurn) currentPlayer = 1 - currentPlayer;
  }

  board = E.finalizeBoard(board);
  const winner = E.getWinner(board);
  return { you: board[6], cpu: board[13], winner, moves: moveCount };
}

// Run all simulations
const levels = ['rookie', 'sharp', 'counter'];
const GAMES = 5;

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║   MANCALA: Trainer vs CPU — Full Simulation Report      ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

for (const level of levels) {
  for (const goFirst of [true, false]) {
    const label = `${level.toUpperCase()} — Trainer goes ${goFirst ? 'FIRST' : 'SECOND'}`;
    console.log(`── ${label} (${GAMES} games) ──`);
    const results = [];
    for (let g = 0; g < GAMES; g++) {
      const start = Date.now();
      const r = simulateGame(level, goFirst);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      results.push(r);
      const outcome = r.winner === 0 ? 'Trainer WIN' : r.winner === 1 ? 'CPU WIN' : 'TIE';
      console.log(`  Game ${g + 1}: You ${r.you} - CPU ${r.cpu}  ${outcome}  [${r.moves} moves, ${elapsed}s]`);
    }
    const w = results.filter(r => r.winner === 0).length;
    const l = results.filter(r => r.winner === 1).length;
    const t = results.filter(r => r.winner === -1).length;
    const ay = (results.reduce((s, r) => s + r.you, 0) / GAMES).toFixed(1);
    const ac = (results.reduce((s, r) => s + r.cpu, 0) / GAMES).toFixed(1);
    console.log(`  ► Trainer ${w}W-${l}L-${t}T  |  Avg: ${ay}-${ac}\n`);
  }
}
