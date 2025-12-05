import React, { useState, useEffect } from 'react';
import { Terminal, X, Wifi, ShieldAlert, CheckCircle2, Circle } from 'lucide-react';

interface BreachProtocolProps {
  onSuccess: (amount: number) => void;
  onClose: () => void;
}

const GRID_SIZE = 5;
const BUFFER_SIZE = 8;
const SYMBOLS = ['1C', 'BD', '55', 'E9', '7A', 'FF'];
const TIME_LIMIT_SECONDS = 30;

interface Cell {
  row: number;
  col: number;
  value: string;
  used: boolean;
}

interface Target {
    id: number;
    sequence: string[];
    reward: number;
    completed: boolean;
    label: string;
}

export const BreachProtocol: React.FC<BreachProtocolProps> = ({ onSuccess, onClose }) => {
  // Game State
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [buffer, setBuffer] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [activeRow, setActiveRow] = useState<number | null>(0); // Starts at Row 0
  const [activeCol, setActiveCol] = useState<number | null>(null);
  const [isVertical, setIsVertical] = useState(false); // False = Horizontal (Row), True = Vertical (Col)
  const [gameStatus, setGameStatus] = useState<'active' | 'won' | 'lost'>('active');
  const [hoveredCell, setHoveredCell] = useState<{r: number, c: number} | null>(null);
  const [totalReward, setTotalReward] = useState(0);

  // Initialize Level
  useEffect(() => {
    // 1. Generate Random Grid
    const newGrid: Cell[][] = Array(GRID_SIZE).fill(null).map((_, r) => 
      Array(GRID_SIZE).fill(null).map((_, c) => ({
        row: r,
        col: c,
        value: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        used: false
      }))
    );

    // 2. Generate Guaranteed Path for Targets
    // We create a "Master Path" of length 7 to derive sub-sequences from.
    // This ensures all targets are mathematically solvable if the user finds the master path.
    let r = 0;
    let c = Math.floor(Math.random() * GRID_SIZE);
    
    // Path includes the start cell
    const masterPathValues = [newGrid[r][c].value];
    
    // Walk 6 more steps (Total 7)
    let curR = r;
    let curC = c;
    let verticalStep = true; // First step is vertical (from row 0)

    for (let i = 0; i < 6; i++) {
        if (verticalStep) {
            // Pick new Row in current Col
            let nextR = Math.floor(Math.random() * GRID_SIZE);
            while (nextR === curR) nextR = Math.floor(Math.random() * GRID_SIZE);
            masterPathValues.push(newGrid[nextR][curC].value);
            curR = nextR;
        } else {
            // Pick new Col in current Row
            let nextC = Math.floor(Math.random() * GRID_SIZE);
            while (nextC === curC) nextC = Math.floor(Math.random() * GRID_SIZE);
            masterPathValues.push(newGrid[curR][nextC].value);
            curC = nextC;
        }
        verticalStep = !verticalStep;
    }

    // Define 3 Targets based on slices of the Master Path
    // Path: v0 v1 v2 v3 v4 v5 v6
    
    // Target 1 (Easy): v0 v1 (Indices 0, 1)
    const t1 = masterPathValues.slice(0, 2);
    // Target 2 (Medium): v2 v3 v4 (Indices 2, 3, 4)
    const t2 = masterPathValues.slice(2, 5);
    // Target 3 (Hard): v4 v5 v6 (Indices 4, 5, 6) - Note overlaps with T2 at v4
    const t3 = masterPathValues.slice(4, 7);

    // Occasionally randomize T3 to make it harder (might not be contiguous with T2 in master path, but still in grid)
    // For safety and guaranteed solvability, we stick to the master path slices for now.

    const newTargets: Target[] = [
        { id: 1, label: 'DATAMINE_V1', sequence: t1, reward: 10, completed: false },
        { id: 2, label: 'DATAMINE_V2', sequence: t2, reward: 15, completed: false },
        { id: 3, label: 'DATAMINE_V3', sequence: t3, reward: 25, completed: false },
    ];

    setGrid(newGrid);
    setTargets(newTargets);
  }, []);

  // Timer
  useEffect(() => {
    if (gameStatus !== 'active') return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameStatus('lost');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStatus]);

  // Check Game Over conditions
  useEffect(() => {
      if (gameStatus !== 'active') return;

      if (buffer.length >= BUFFER_SIZE) {
          // End of buffer
          if (totalReward > 0) {
              finishGame(true);
          } else {
              setGameStatus('lost');
          }
      }
  }, [buffer, totalReward, gameStatus]);

  const finishGame = (won: boolean) => {
      setGameStatus(won ? 'won' : 'lost');
      if (won) {
          setTimeout(() => onSuccess(totalReward), 1500);
      }
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameStatus !== 'active') return;
    
    // Validate Move
    const cell = grid[r][c];
    if (cell.used) return;

    const isValidMove = isVertical 
        ? c === activeCol // Must match active column
        : r === activeRow; // Must match active row

    if (!isValidMove) return;

    // Execute Move
    const newBuffer = [...buffer, cell.value];
    setBuffer(newBuffer);
    
    // Mark used
    const newGrid = [...grid];
    newGrid[r][c] = { ...newGrid[r][c], used: true };
    setGrid(newGrid);

    // Check Targets
    const bufferStr = newBuffer.join('');
    let newTotalReward = totalReward;
    const updatedTargets = targets.map(t => {
        if (!t.completed && bufferStr.includes(t.sequence.join(''))) {
            newTotalReward += t.reward;
            return { ...t, completed: true };
        }
        return t;
    });
    
    setTargets(updatedTargets);
    setTotalReward(newTotalReward);

    // Prepare next turn
    if (isVertical) {
        // Was Vertical (selected a row in col), now Horizontal (select col in row)
        setActiveRow(r);
        setActiveCol(null);
        setIsVertical(false);
    } else {
        // Was Horizontal (selected a col in row), now Vertical (select row in col)
        setActiveCol(c);
        setActiveRow(null);
        setIsVertical(true);
    }
  };

  const getCellStatus = (r: number, c: number) => {
      const cell = grid[r][c];
      if (cell.used) return 'used';
      
      const isActiveAxis = isVertical 
        ? c === activeCol 
        : r === activeRow;
      
      if (!isActiveAxis) return 'inactive';
      
      // It is in the active axis
      if (hoveredCell && hoveredCell.r === r && hoveredCell.c === c) return 'hover';
      
      return 'selectable';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0a0a0a] border-2 border-zinc-700 shadow-[0_0_50px_rgba(250,204,21,0.1)] relative overflow-hidden flex flex-col lg:flex-row">
        
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-red-500 shadow-[0_0_10px_#facc15]"></div>

        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-2 right-2 p-2 text-zinc-500 hover:text-white z-20"
        >
            <X className="w-6 h-6" />
        </button>

        {/* Left Panel: Grid */}
        <div className="p-6 lg:p-8 flex-1 border-b lg:border-b-0 lg:border-r border-zinc-800 relative bg-[#0a0a0a]">
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2 text-yellow-400 animate-pulse">
                    <Wifi className="w-5 h-5" />
                    <span className="font-mono font-bold tracking-widest uppercase">Breach Protocol_v2.0</span>
                </div>
                <div className="font-mono text-zinc-500 text-xs">
                    SERVER_ID: 0x89A4 // SEC_LVL: 5
                </div>
             </div>

             <div className="grid grid-cols-5 gap-2 sm:gap-3 max-w-[400px] mx-auto mb-8">
                 {grid.map((row, r) => (
                     row.map((cell, c) => {
                         const status = getCellStatus(r, c);
                         let className = "aspect-square flex items-center justify-center font-mono font-bold text-sm sm:text-lg transition-all border ";
                         
                         switch(status) {
                             case 'used':
                                 className += "border-transparent text-zinc-800 bg-zinc-900/50 cursor-not-allowed";
                                 break;
                             case 'hover':
                                 className += "border-yellow-400 bg-yellow-400 text-black cursor-pointer shadow-[0_0_15px_#facc15] scale-105";
                                 break;
                             case 'selectable':
                                 className += "border-zinc-700 bg-zinc-900/80 text-cyan-400 hover:border-yellow-400 cursor-pointer shadow-[0_0_5px_rgba(6,182,212,0.3)]";
                                 break;
                             case 'inactive':
                             default:
                                 className += "border-transparent text-zinc-600 opacity-50";
                                 break;
                         }

                         return (
                             <button
                                key={`${r}-${c}`}
                                onClick={() => handleCellClick(r, c)}
                                onMouseEnter={() => setHoveredCell({r, c})}
                                onMouseLeave={() => setHoveredCell(null)}
                                disabled={status === 'used' || status === 'inactive' || gameStatus !== 'active'}
                                className={className}
                             >
                                 {status === 'used' ? '[]' : cell.value}
                             </button>
                         )
                     })
                 ))}
             </div>

              {/* Buffer Display (Moved to bottom left for easier tracking) */}
              <div className="mt-auto">
                    <div className="text-xs font-mono text-zinc-500 mb-2 uppercase flex justify-between">
                        <span>Buffer Memory</span>
                        <span>{buffer.length} / {BUFFER_SIZE}</span>
                    </div>
                    <div className="flex space-x-1 h-10 border border-zinc-700 bg-zinc-900/30 p-1">
                        {Array(BUFFER_SIZE).fill(null).map((_, i) => (
                            <div 
                                key={i} 
                                className={`flex-1 flex items-center justify-center font-mono text-xs border ${
                                    buffer[i] 
                                    ? 'border-cyan-500 text-cyan-400 bg-cyan-900/30 shadow-[0_0_5px_rgba(6,182,212,0.4)]' 
                                    : 'border-zinc-800 bg-black/50 text-zinc-700'
                                }`}
                            >
                                {buffer[i] || ''}
                            </div>
                        ))}
                    </div>
                </div>
        </div>

        {/* Right Panel: Info & Targets */}
        <div className="w-full lg:w-80 bg-[#080808] p-6 flex flex-col relative">
             
             {/* Timer */}
             <div className="mb-8">
                <div className="flex justify-between text-xs font-mono text-zinc-500 mb-1">
                    <span>BREACH_TIME_LIMIT</span>
                    <span className={timeLeft < 10 ? "text-red-500 font-bold" : "text-white"}>{timeLeft.toFixed(2)}s</span>
                </div>
                <div className="h-1 bg-zinc-800 w-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 5 ? 'bg-red-500' : 'bg-yellow-400'}`}
                        style={{ width: `${(timeLeft / TIME_LIMIT_SECONDS) * 100}%` }}
                    ></div>
                </div>
             </div>

             {/* Targets List */}
             <div className="flex-grow space-y-4">
                 <div className="text-xs font-mono text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Available Daemons</div>
                 
                 {targets.map((target) => (
                     <div 
                        key={target.id}
                        className={`border p-3 transition-all duration-300 ${
                            target.completed 
                            ? 'bg-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
                            : 'bg-zinc-900/30 border-zinc-800'
                        }`}
                     >
                         <div className="flex justify-between items-center mb-2">
                             <div className={`text-xs font-bold font-mono ${target.completed ? 'text-green-400' : 'text-zinc-300'}`}>
                                 {target.label}
                             </div>
                             <div className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                                 target.completed 
                                 ? 'border-green-500 text-green-400' 
                                 : 'border-yellow-600/50 text-yellow-600'
                             }`}>
                                 REWARD: {target.reward}
                             </div>
                         </div>
                         <div className="flex space-x-2">
                             {target.sequence.map((val, i) => (
                                 <span key={i} className={`font-mono text-sm font-bold ${
                                     target.completed ? 'text-green-300' : 'text-zinc-400'
                                 }`}>
                                     {val}
                                 </span>
                             ))}
                         </div>
                     </div>
                 ))}
             </div>

             {/* Total Status */}
             <div className="mt-8 border-t border-zinc-800 pt-6">
                 <div className="flex justify-between items-center mb-4">
                     <span className="text-xs font-mono text-zinc-500">TOTAL_REWARD</span>
                     <span className="text-xl font-black text-yellow-400 font-mono tracking-tighter">{totalReward} <span className="text-xs text-yellow-600">CREDS</span></span>
                 </div>

                 {gameStatus === 'active' && (
                     <div className="text-center text-[10px] font-mono text-zinc-600 animate-pulse">
                         // UPLOADING DAEMONS...
                     </div>
                 )}
                 {gameStatus === 'won' && (
                     <div className="bg-green-500/10 border border-green-500/50 p-2 text-green-400 font-bold uppercase text-xs tracking-widest flex items-center justify-center animate-bounce">
                         <Terminal className="w-4 h-4 mr-2" /> UPLOAD COMPLETE
                     </div>
                 )}
                 {gameStatus === 'lost' && (
                     <div className="bg-red-500/10 border border-red-500/50 p-2 text-red-500 font-bold uppercase text-xs tracking-widest flex items-center justify-center animate-pulse">
                         <ShieldAlert className="w-4 h-4 mr-2" /> BREACH FAILED
                     </div>
                 )}
             </div>

        </div>

        {/* CRT Overlay Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%] pointer-events-none z-10 opacity-20"></div>
      </div>
    </div>
  );
};