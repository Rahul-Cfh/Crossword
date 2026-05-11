import { useState, useMemo, useRef } from 'react';
import CrosswordGrid, { CrosswordGridHandle } from './CrosswordGrid';
import { GRID, WORDS, checkWord } from './gridData';

const ROWS = GRID.length;
const COLS = GRID[0]?.length ?? 0;
const EMPTY_INPUT: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(''));

interface RaffleForm {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
}

const EMPTY_RAFFLE: RaffleForm = { firstName: '', lastName: '', company: '', email: '' };

export default function App() {
  const gridRef = useRef<CrosswordGridHandle>(null);
  const [userInput, setUserInput] = useState<string[][]>(EMPTY_INPUT);
  const [submitted, setSubmitted] = useState(false);
  const [raffleForm, setRaffleForm] = useState<RaffleForm>(EMPTY_RAFFLE);
  const [raffleSubmitted, setRaffleSubmitted] = useState(false);
  const [raffleError, setRaffleError] = useState('');

  const wordResults = useMemo(
    () => WORDS.map((w) => ({ word: w, correct: checkWord(w, userInput) })),
    [userInput]
  );

  const correctCount = useMemo(
    () => (submitted ? wordResults.filter((r) => r.correct).length : 0),
    [submitted, wordResults]
  );

  const showRaffleForm = submitted && correctCount >= 4;

  const correctCells = useMemo<boolean[][]>(() => {
    const cells = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    if (!submitted) return cells;
    for (const { word, correct } of wordResults) {
      if (!correct) continue;
      for (let i = 0; i < word.answer.length; i++) {
        const r = word.direction === 'across' ? word.startRow : word.startRow + i;
        const c = word.direction === 'across' ? word.startCol + i : word.startCol;
        if (r < ROWS && c < COLS) cells[r][c] = true;
      }
    }
    return cells;
  }, [submitted, wordResults]);

  const handleCellChange = (row: number, col: number, value: string) => {
    setUserInput((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = value;
      return next;
    });
    if (submitted) setSubmitted(false);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setUserInput(EMPTY_INPUT);
    setSubmitted(false);
    setRaffleForm(EMPTY_RAFFLE);
    setRaffleSubmitted(false);
    setRaffleError('');
    setTimeout(() => gridRef.current?.focusFirst(), 0);
  };

  const handleFieldChange = (field: keyof RaffleForm, value: string) => {
    setRaffleForm((prev) => ({ ...prev, [field]: value }));
    if (raffleError) setRaffleError('');
  };

  const handleRaffleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!raffleForm.firstName.trim()) { setRaffleError('First name is required.'); return; }
    if (!raffleForm.lastName.trim()) { setRaffleError('Last name is required.'); return; }
    if (!raffleForm.company.trim()) { setRaffleError('Company is required.'); return; }
    if (!emailRegex.test(raffleForm.email)) { setRaffleError('Please enter a valid email address.'); return; }

    const entry = {
      firstName: raffleForm.firstName.trim(),
      lastName: raffleForm.lastName.trim(),
      company: raffleForm.company.trim(),
      email: raffleForm.email.trim(),
      score: correctCount,
      submittedAtISO: new Date().toISOString(),
    };

    const key = 'underwriters_crossword_entries';
    const existing = localStorage.getItem(key);
    const entries = existing ? JSON.parse(existing) : [];
    entries.push(entry);
    localStorage.setItem(key, JSON.stringify(entries));

    setRaffleSubmitted(true);
  };

  const acrossClues = WORDS.filter((w) => w.direction === 'across').sort(
    (a, b) => a.clueNumber - b.clueNumber
  );
  const downClues = WORDS.filter((w) => w.direction === 'down').sort(
    (a, b) => a.clueNumber - b.clueNumber
  );

  const acrossCluesContent = (
    <div>
      <h2 className="cw-clue-heading">Across</h2>
      <div className="cw-clue-list">
        {acrossClues.map(({ clueNumber, clue, id }) => {
          const result = wordResults.find((r) => r.word.id === id);
          const isCorrect = submitted && result?.correct;
          const isWrong = submitted && !result?.correct;
          return (
            <div key={id} className="cw-clue-row">
              <span className="cw-clue-num">{clueNumber}.</span>
              <span className={`cw-clue-text${isCorrect ? ' cw-correct' : isWrong ? ' cw-wrong' : ''}`}>
                {clue}
              </span>
              {isCorrect && <span className="cw-check">✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  const downCluesContent = (
    <div>
      <h2 className="cw-clue-heading">Down</h2>
      <div className="cw-clue-list">
        {downClues.map(({ clueNumber, clue, id }) => {
          const result = wordResults.find((r) => r.word.id === id);
          const isCorrect = submitted && result?.correct;
          const isWrong = submitted && !result?.correct;
          return (
            <div key={id} className="cw-clue-row">
              <span className="cw-clue-num">{clueNumber}.</span>
              <span className={`cw-clue-text${isCorrect ? ' cw-correct' : isWrong ? ' cw-wrong' : ''}`}>
                {clue}
              </span>
              {isCorrect && <span className="cw-check">✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  const cluesSections = (
    <div className="cw-clues-two-col">
      <div>{acrossCluesContent}</div>
      <div>{downCluesContent}</div>
    </div>
  );

  const cluesDetailedSections = (
    <>
      {acrossCluesContent}
      {downCluesContent}
    </>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        overflowX: 'hidden',
        paddingTop: 'max(8px, env(safe-area-inset-top))',
        paddingBottom: '8px',
        backgroundImage: 'url(/files_4696452-2026-01-27T11-14-49-860Z-image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Page header — outside glass card so it never gets clipped */}
      <div style={{ width: 'min(980px, calc(100% - 24px))', margin: '0 auto', textAlign: 'center', padding: '0 4px 6px' }}>
        <h1
          style={{
            fontSize: 'clamp(1.1rem, 3.5vw, 1.6rem)',
            fontWeight: 800,
            color: '#000',
            marginBottom: '2px',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            wordBreak: 'break-word',
          }}
        >
          The Underwriter's Crossword
        </h1>
        <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#374151' }}>
          Get 4 or more words correct to enter the iPad raffle.
        </p>
      </div>

      {/* Glass card — width matches header */}
      <div className="cw-glass" style={{ width: 'min(980px, calc(100% - 24px))' }}>

        {/* Main content row: grid (left) + clues (right) */}
        <div className="cw-content-row">

          {/* Grid column */}
          <div className="cw-grid-col">
            <div className="cw-grid-viewport">
              <div className="cw-grid-scroll-inner">
                <CrosswordGrid
                  ref={gridRef}
                  userInput={userInput}
                  onCellChange={handleCellChange}
                  submitted={submitted}
                  correctCells={correctCells}
                />
              </div>
            </div>
          </div>

          {/* Clues column — desktop: always visible */}
          <div className="cw-clues-col" style={{ position: 'relative' }}>
            <div className="hidden lg:block">
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '14px' }}>
                <img
                  src="/image.png"
                  alt="HyperVerge"
                  style={{ height: '104px', width: 'auto', objectFit: 'contain' }}
                />
              </div>
              {cluesSections}
            </div>
          </div>
        </div>

        {/* Mobile clue box — below grid, hidden on desktop */}
        <div className="cw-cluebox lg:hidden">
          {cluesDetailedSections}
        </div>

        {/* Mobile action row — side-by-side, hidden on desktop */}
        <div className="cw-mobile-actions lg:hidden">
          <button onClick={handleSubmit} className="cw-btn cw-btn-primary">Submit</button>
          <button onClick={handleReset} className="cw-btn cw-btn-secondary">Reset</button>
        </div>

        {/* Footer: buttons — desktop only */}
        <div className="cw-btn-row hidden lg:flex">
          <button onClick={handleSubmit} className="cw-btn cw-btn-primary">
            Submit
          </button>
          <button onClick={handleReset} className="cw-btn cw-btn-secondary">
            Reset
          </button>
        </div>

        {/* Score banner */}
        {submitted && (
          <div style={{ maxWidth: '560px', margin: '10px auto 0', padding: '10px 16px', border: '2px solid #000', background: '#fff', textAlign: 'center' }}>
            {correctCount >= 4 ? (
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#000' }}>
                Nice. You got {correctCount} out of {WORDS.length}. Enter your details below.
              </p>
            ) : (
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#000' }}>
                You got {correctCount} out of {WORDS.length}. Try again.
              </p>
            )}
          </div>
        )}

        {/* Raffle form */}
        {showRaffleForm && (
          <div style={{ maxWidth: '560px', margin: '8px auto 0', padding: '14px 16px', border: '2px solid #000', background: '#fff' }}>
            <form onSubmit={handleRaffleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="first-name" style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', marginBottom: '4px', color: '#000' }}>
                    First Name
                  </label>
                  <input
                    id="first-name"
                    type="text"
                    required
                    disabled={raffleSubmitted}
                    value={raffleForm.firstName}
                    onChange={(e) => handleFieldChange('firstName', e.target.value)}
                    style={{ width: '100%', padding: '5px 10px', border: '2px solid #000', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label htmlFor="last-name" style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', marginBottom: '4px', color: '#000' }}>
                    Last Name
                  </label>
                  <input
                    id="last-name"
                    type="text"
                    required
                    disabled={raffleSubmitted}
                    value={raffleForm.lastName}
                    onChange={(e) => handleFieldChange('lastName', e.target.value)}
                    style={{ width: '100%', padding: '5px 10px', border: '2px solid #000', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="company" style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', marginBottom: '4px', color: '#000' }}>
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  required
                  disabled={raffleSubmitted}
                  value={raffleForm.company}
                  onChange={(e) => handleFieldChange('company', e.target.value)}
                  style={{ width: '100%', padding: '5px 10px', border: '2px solid #000', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label htmlFor="raffle-email" style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', marginBottom: '4px', color: '#000' }}>
                  Email
                </label>
                <input
                  id="raffle-email"
                  type="email"
                  required
                  disabled={raffleSubmitted}
                  value={raffleForm.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  style={{ width: '100%', padding: '5px 10px', border: '2px solid #000', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>
              {raffleError && (
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#dc2626' }}>{raffleError}</p>
              )}
              {raffleSubmitted ? (
                <p style={{ textAlign: 'center', fontWeight: 700, color: '#000', padding: '8px 0' }}>
                  You're entered in the iPad draw.
                </p>
              ) : (
                <button
                  type="submit"
                  style={{ width: '100%', padding: '10px 32px', background: '#000', color: '#fff', fontWeight: 700, border: '2px solid #000', fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  Enter Raffle
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
