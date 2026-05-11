export type CellType = 'black' | 'letter';

export interface Cell {
  type: CellType;
  correctLetter: string;
  clueNumber: number | null;
}

export interface Word {
  id: string;
  direction: 'across' | 'down';
  clueNumber: number;
  startRow: number;
  startCol: number;
  answer: string;
  clue: string;
}
