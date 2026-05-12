import { useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';

interface CrosswordGridProps {
  userInput: string[][];
  onCellChange: (row: number, col: number, value: string) => void;
  submitted: boolean;
  correctCells: boolean[][];
}

export interface CrosswordGridHandle {
  focusFirst: () => void;
}

type Direction = 'across' | 'down';

// Define the exact cell positions for each answer
const ANSWER_CELLS: Record<string, [number, number][]> = {
  lien:        [[1,2],[2,2],[3,2],[4,2]],
  registry:    [[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[3,8]],
  stipulation: [[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[12,4],[13,4]],
  first:       [[3,9],[4,9],[5,9],[6,9],[7,9]],
  guarantor:   [[5,5],[5,6],[5,7],[5,8],[5,9],[5,10],[5,11],[5,12],[5,13]],
  overdrawn:   [[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2]],
  clear: [[8,3],[8,4],[8,5],[8,6],[8,7]],
  riskclass:   [[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12]],
  statements:  [[10,3],[10,4],[10,5],[10,6],[10,7],[10,8],[10,9],[10,10],[10,11],[10,12]],
  backdate:    [[12,1],[12,2],[12,3],[12,4],[12,5],[12,6],[12,7],[12,8]],
  decline:     [[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],[18,9]],
};

const CLUE_NUMBERS: Record<string, number> = {
  '1,2':  1,
  '3,1':  2,
  '3,4':  3,
  '3,9':  4,
  '5,5':  5,
  '6,2':  6,
  '8,3':  7,
  '8,12': 8,
  '10,3': 9,
  '12,1': 10,
  '12,9': 11,
};



// Create a set of all valid cells for quick lookup
const VALID_CELLS = new Set<string>();
Object.values(ANSWER_CELLS).forEach(cells => {
  cells.forEach(([r, c]) => {
    VALID_CELLS.add(`${r},${c}`);
  });
});

// Find grid bounds
const rows = Array.from(VALID_CELLS).map(k => parseInt(k.split(',')[0]));
const cols = Array.from(VALID_CELLS).map(k => parseInt(k.split(',')[1]));
const MAX_ROW = Math.max(...rows);
const MAX_COL = Math.max(...cols);

function isPlayable(r: number, c: number): boolean {
  return VALID_CELLS.has(`${r},${c}`);
}

function getWordCells(row: number, col: number, dir: Direction): [number, number][] {
  const cells: [number, number][] = [];
  if (dir === 'across') {
    let c = col;
    while (c >= 1 && isPlayable(row, c - 1)) c--;
    while (c <= MAX_COL && isPlayable(row, c)) { cells.push([row, c]); c++; }
  } else {
    let r = row;
    while (r >= 1 && isPlayable(r - 1, col)) r--;
    while (r <= MAX_ROW && isPlayable(r, col)) { cells.push([r, col]); r++; }
  }
  return cells;
}

function getActiveClue(row: number, col: number, dir: Direction): string {
  const clueMap: Record<string, Record<Direction, { num: number; text: string }>> = {
    '1,2': { down: { num: 1, text: 'A Claim you didn\'t notice' } },
    '3,1': { across: { num: 2, text: 'Public memory for your collateral\'s worst surprises' } },
    '3,4': { across: { num: 3, text: 'Where no findings is the finding' }, down: { num: 3, text: 'Where no findings is the finding' } },
    '3,9': { down: { num: 4, text: 'Position that matters after default' } },
    '5,5': { across: { num: 5, text: 'The second balance sheet in the file' } },
    '6,2': { down: { num: 6, text: 'Negative, and not just once' } },
    '8,3': { across: { num: 7, text: 'Where no findings is the finding' } },
    '8,12': { down: { num: 8, text: 'The box you\'re quietly put in' } },
    '10,3': { across: { num: 9, text: 'Where the real story shows up' } },
    '12,1': { across: { num: 10, text: 'When paperwork time travels' } },
    '12,9': { across: { num: 11, text: 'The no that isn\'t always final' }, down: { num: 11, text: 'The no that isn\'t always final' } },
  };

  const cells = getWordCells(row, col, dir);
  const startCell = cells[0];
  const key = `${startCell[0]},${startCell[1]}`;
  const clue = clueMap[key]?.[dir];
  if (!clue) return '';
  return `${clue.num}${dir === 'across' ? 'A' : 'D'} — ${clue.text}`;
}

function getNextCell(row: number, col: number, dir: Direction): [number, number] | null {
  if (dir === 'across') {
    for (let c = col + 1; c <= MAX_COL; c++) {
      if (isPlayable(row, c)) return [row, c];
    }
  } else {
    for (let r = row + 1; r <= MAX_ROW; r++) {
      if (isPlayable(r, col)) return [r, col];
    }
  }
  return null;
}

function getPrevCell(row: number, col: number, dir: Direction): [number, number] | null {
  if (dir === 'across') {
    for (let c = col - 1; c >= 1; c--) {
      if (isPlayable(row, c)) return [row, c];
    }
  } else {
    for (let r = row - 1; r >= 1; r--) {
      if (isPlayable(r, col)) return [r, col];
    }
  }
  return null;
}

function inferDirection(r: number, c: number, prevDir: Direction): Direction {
  const hasRight = isPlayable(r, c + 1);
  const hasLeft = isPlayable(r, c - 1);
  const hasDown = isPlayable(r + 1, c);
  const hasUp = isPlayable(r - 1, c);
  const canAcross = hasRight || hasLeft;
  const canDown = hasDown || hasUp;
  if (canAcross && !canDown) return 'across';
  if (canDown && !canAcross) return 'down';
  return prevDir;
}

const CrosswordGrid = forwardRef<CrosswordGridHandle, CrosswordGridProps>(function CrosswordGrid({
  userInput,
  onCellChange,
  submitted,
  correctCells,
}: CrosswordGridProps, ref) {
  const inputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

  const [activeCell, setActiveCell] = useState<[number, number] | null>(null);
  const [activeDir, setActiveDir] = useState<Direction>('across');
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const focusCell = useCallback((r: number, c: number) => {
    inputRefs.current.get(`${r},${c}`)?.focus();
  }, []);

  useImperativeHandle(ref, () => ({
    focusFirst: () => {
      for (const key of VALID_CELLS) {
        const [r, c] = key.split(',').map(Number);
        setActiveCell([r, c]);
        setActiveDir('across');
        focusCell(r, c);
        return;
      }
    },
  }));

  const handleCellClick = (r: number, c: number) => {
    if (activeCell && activeCell[0] === r && activeCell[1] === c) {
      setActiveDir((d) => {
        const toggled = d === 'across' ? 'down' : 'across';
        return inferDirection(r, c, toggled);
      });
    } else {
      setActiveCell([r, c]);
      setActiveDir((d) => inferDirection(r, c, d));
    }
    focusCell(r, c);
  };

  const handleKeyDown = (row: number, col: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (userInput[row][col] !== '') {
        onCellChange(row, col, '');
      } else {
        const prev = getPrevCell(row, col, activeDir);
        if (prev) {
          onCellChange(prev[0], prev[1], '');
          setActiveCell(prev);
          focusCell(prev[0], prev[1]);
        }
      }
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      for (let c = col + 1; c <= MAX_COL; c++) {
        if (isPlayable(row, c)) { setActiveCell([row, c]); focusCell(row, c); break; }
      }
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      for (let c = col - 1; c >= 1; c--) {
        if (isPlayable(row, c)) { setActiveCell([row, c]); focusCell(row, c); break; }
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      for (let r = row + 1; r <= MAX_ROW; r++) {
        if (isPlayable(r, col)) { setActiveCell([r, col]); focusCell(r, col); break; }
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      for (let r = row - 1; r >= 1; r--) {
        if (isPlayable(r, col)) { setActiveCell([r, col]); focusCell(r, col); break; }
      }
      return;
    }
  };

  const handleChange = (row: number, col: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^a-zA-Z]/g, '');
    const letter = raw.slice(-1).toUpperCase();
    onCellChange(row, col, letter);
    if (letter) {
      const next = getNextCell(row, col, activeDir);
      if (next) {
        setActiveCell(next);
        focusCell(next[0], next[1]);
      }
    }
  };

  const wordCells = activeCell
    ? new Set(
        getWordCells(activeCell[0], activeCell[1], activeDir).map(([r, c]) => `${r},${c}`)
      )
    : new Set<string>();

  const activeKey = activeCell ? `${activeCell[0]},${activeCell[1]}` : '';
  const activeClue = activeCell ? getActiveClue(activeCell[0], activeCell[1], activeDir) : '';

 const CELL_SIZE = typeof window !== 'undefined' && window.innerWidth < 600
    ? Math.floor((window.innerWidth - 32) / 16)
    : 40;
  const gridWidth = MAX_COL * CELL_SIZE;
  const gridHeight = MAX_ROW * CELL_SIZE;

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div
        className="cw-active-clue-bar w-full truncate min-h-[24px]"
        style={{ fontSize: 'clamp(13px, 3vw, 16px)' }}
      >
        {activeClue || <span className="cw-active-clue-placeholder">Tap a cell to begin</span>}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          padding: '16px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
     
        <div
          style={{
            position: 'relative',
            width: `${gridWidth}px`,
            height: `${gridHeight}px`,
            background: 'transparent',
          }}
        >
          {Array.from(VALID_CELLS).map((key) => {
            const [r, c] = key.split(',').map(Number);
            const cellKey = `${r},${c}`;
            const isActive = cellKey === activeKey;
            const isHighlighted = wordCells.has(cellKey) && !isActive;
            const isWrong = submitted && userInput[r]?.[c] !== '' && !correctCells[r]?.[c];
            const clueNum = CLUE_NUMBERS[cellKey] || null;

            let bg = 'rgba(255,255,255,0.18)';
            if (isActive) bg = 'rgba(255, 220, 120, 0.45)';
            else if (isHighlighted) bg = 'rgba(140, 200, 255, 0.28)';
            else if (isWrong) bg = 'rgba(255,80,80,0.22)';
            else if (hoveredCell === cellKey) bg = 'rgba(255,255,255,0.28)';

            return (
              <div
                key={cellKey}
                className="cw-cell"
                style={{
                  position: 'absolute',
                  left: `${(c - 1) * CELL_SIZE}px`,
                  top: `${(r - 1) * CELL_SIZE}px`,
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  backgroundColor: bg,
                  border: isActive
                    ? '2px solid rgba(255, 220, 120, 0.8)'
                    : '1px solid rgba(255,255,255,0.28)',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseDown={(e) => { e.preventDefault(); handleCellClick(r, c); }}
                onMouseEnter={() => setHoveredCell(cellKey)}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {clueNum !== null && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: '2px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: 'rgba(255,255,255,0.7)',
                      lineHeight: '1',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      zIndex: 2,
                    }}
                  >
                    {clueNum}
                  </span>
                )}
                <input
                  ref={(el) => {
                    if (el) inputRefs.current.set(cellKey, el);
                    else inputRefs.current.delete(cellKey);
                  }}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={1}
                  value={userInput[r]?.[c] || ''}
                  onChange={(e) => handleChange(r, c, e)}
                  onKeyDown={(e) => handleKeyDown(r, c, e)}
                  onFocus={() => setActiveCell([r, c])}
                  className="cw-cell-letter focus:outline-none"
                  readOnly={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.95)',
                    caretColor: 'rgba(255,220,120,0.7)',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default CrosswordGrid;
