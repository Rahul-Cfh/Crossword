import type { Cell, CellType, Word } from './types';

export const WORDS: Word[] = [
  {
    id: 'lien',
    direction: 'down',
    clueNumber: 1,
    startRow: 1,
    startCol: 2,
    answer: 'LIEN',
    clue: "A claim you didn't notice",
  },
  {
    id: 'registry',
    direction: 'across',
    clueNumber: 2,
    startRow: 3,
    startCol: 1,
    answer: 'REGISTRY',
    clue: "Public memory for your collateral's worst surprises",
  },
  {
    id: 'stipulation',
    direction: 'down',
    clueNumber: 3,
    startRow: 3,
    startCol: 4,
    answer: 'STIPULATION',
    clue: 'Greenlit, with conditions attached',
  },
  {
    id: 'first',
    direction: 'down',
    clueNumber: 4,
    startRow: 3,
    startCol: 9,
    answer: 'FIRST',
    clue: 'Position that matters after default',
  },
  {
    id: 'guarantor',
    direction: 'across',
    clueNumber: 5,
    startRow: 5,
    startCol: 5,
    answer: 'GUARANTOR',
    clue: 'The second balance sheet in the file',
  },
  {
    id: 'overdrawn',
    direction: 'down',
    clueNumber: 6,
    startRow: 6,
    startCol: 2,
    answer: 'OVERDRAWN',
    clue: 'Negative, and not just once',
  },
  {
    id: 'clear',
    direction: 'across',
    clueNumber: 7,
    startRow: 8,
    startCol: 3,
    answer: 'CLEAR',
    clue: 'Where no findings is the finding',
  },
  {
    id: 'riskclass',
    direction: 'down',
    clueNumber: 8,
    startRow: 8,
    startCol: 12,
    answer: 'RISKCLASS',
    clue: "The box you're quietly put in",
  },
  {
    id: 'statements',
    direction: 'across',
    clueNumber: 9,
    startRow: 10,
    startCol: 3,
    answer: 'STATEMENTS',
    clue: 'Where the real story shows up',
  },
  {
    id: 'backdate',
    direction: 'across',
    clueNumber: 10,
    startRow: 12,
    startCol: 1,
    answer: 'BACKDATE',
    clue: 'When paperwork time travels',
  },
  {
    id: 'decline',
    direction: 'down',
    clueNumber: 11,
    startRow: 12,
    startCol: 9,
    answer: 'DECLINE',
    clue: "The no that isn't always final",
  },
];

function buildGrid(): Cell[][] {
  if (WORDS.length === 0) return [];

  let maxRow = 0;
  let maxCol = 0;

  for (const word of WORDS) {
    if (word.direction === 'across') {
      maxRow = Math.max(maxRow, word.startRow);
      maxCol = Math.max(maxCol, word.startCol + word.answer.length - 1);
    } else {
      maxRow = Math.max(maxRow, word.startRow + word.answer.length - 1);
      maxCol = Math.max(maxCol, word.startCol);
    }
  }

  const rows = maxRow + 1;
  const cols = maxCol + 1;

  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      type: 'black' as CellType,
      correctLetter: '',
      clueNumber: null,
    }))
  );

  const place = (r: number, c: number, letter: string) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    grid[r][c] = { type: 'letter', correctLetter: letter, clueNumber: null };
  };

  for (const word of WORDS) {
    word.answer.split('').forEach((letter, i) => {
      const r = word.direction === 'across' ? word.startRow : word.startRow + i;
      const c = word.direction === 'across' ? word.startCol + i : word.startCol;
      place(r, c, letter);
    });
  }

  for (const word of WORDS) {
    const cell = grid[word.startRow]?.[word.startCol];
    if (cell) cell.clueNumber = word.clueNumber;
  }

  return grid;
}

export const GRID: Cell[][] = buildGrid();

function computeBoundingBox(grid: Cell[][]): { minRow: number; maxRow: number; minCol: number; maxCol: number } {
  let minRow = grid.length;
  let maxRow = 0;
  let minCol = grid[0]?.length ?? 0;
  let maxCol = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
      if (grid[r][c].type === 'letter') {
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
      }
    }
  }
  return { minRow, maxRow, minCol, maxCol };
}

const RAW_BBOX = computeBoundingBox(GRID);

export const BBOX = RAW_BBOX;

export function checkWord(word: Word, userInput: string[][]): boolean {
  for (let i = 0; i < word.answer.length; i++) {
    const row = word.direction === 'across' ? word.startRow : word.startRow + i;
    const col = word.direction === 'across' ? word.startCol + i : word.startCol;
    const typed = (userInput[row]?.[col] ?? '').toUpperCase();
    if (!typed) return false;
    const correct = GRID[row]?.[col]?.correctLetter ?? '';
    if (typed !== correct) return false;
  }
  return true;
}