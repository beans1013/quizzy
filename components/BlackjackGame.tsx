import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { updateUserScore } from '../services/authService';
import { Dices, ShieldAlert, CreditCard, RefreshCw, Hand, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface Card {
  suit: string;
  rank: string;
  value: number;
}

interface BlackjackGameProps {
  user: UserProfile;
  onScoreUpdate: (newScore: number) => void;
}

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const BlackjackGame: React.FC<BlackjackGameProps> = ({ user, onScoreUpdate }) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealerTurn' | 'gameOver'>('betting');
  const [bet, setBet] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [tempBetInput, setTempBetInput] = useState('10');

  // Audio simulation (visual only for now)
  const [sfx, setSfx] = useState<string | null>(null);

  const createDeck = () => {
    const newDeck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        let value = parseInt(rank);
        if (['J', 'Q', 'K'].includes(rank)) value = 10;
        if (rank === 'A') value = 11;
        newDeck.push({ suit, rank, value });
      }
    }
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const calculateScore = (hand: Card[]) => {
    let score = hand.reduce((acc, card) => acc + card.value, 0);
    let aces = hand.filter(c => c.rank === 'A').length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  };

  const handleFaucet = () => {
      const bonus = 50;
      updateUserScore(bonus);
      onScoreUpdate(user.totalScore + bonus);
      setMessage("EMERGENCY FUNDS TRANSFERRED. DON'T MAKE IT A HABIT.");
  };

  const placeBet = () => {
    const amount = parseInt(tempBetInput);
    if (isNaN(amount) || amount <= 0) {
        setMessage("INVALID WAGER DETECTED.");
        return;
    }
    if (amount > user.totalScore) {
        setMessage("INSUFFICIENT FUNDS.");
        return;
    }

    setBet(amount);
    // Deduct immediately (visual only, synced on game end)
    updateUserScore(-amount); 
    onScoreUpdate(user.totalScore - amount);
    
    startRound();
  };

  const startRound = () => {
    const newDeck = createDeck();
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];
    
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('playing');
    setMessage('');
    
    const pScore = calculateScore(pHand);
    if (pScore === 21) {
       resolveGame(pHand, dHand, 'blackjack');
    }
  };

  const hit = () => {
    const newHand = [...playerHand, deck.pop()!];
    setPlayerHand(newHand);
    const score = calculateScore(newHand);
    if (score > 21) {
      resolveGame(newHand, dealerHand, 'bust');
    }
  };

  const stand = () => {
    setGameState('dealerTurn');
    let dHand = [...dealerHand];
    let dScore = calculateScore(dHand);
    const dDeck = [...deck];

    while (dScore < 17) {
      dHand.push(dDeck.pop()!);
      dScore = calculateScore(dHand);
    }
    
    setDealerHand(dHand);
    setDeck(dDeck);
    
    const pScore = calculateScore(playerHand);
    
    if (dScore > 21) resolveGame(playerHand, dHand, 'dealerBust');
    else if (dScore > pScore) resolveGame(playerHand, dHand, 'lose');
    else if (dScore < pScore) resolveGame(playerHand, dHand, 'win');
    else resolveGame(playerHand, dHand, 'push');
  };

  const resolveGame = (pHand: Card[], dHand: Card[], result: string) => {
    setGameState('gameOver');
    let winnings = 0;
    
    switch(result) {
        case 'blackjack':
            winnings = Math.floor(bet * 2.5); // Return bet + 1.5x
            setMessage('BLACKJACK! SYSTEM OVERRIDE SUCCESSFUL.');
            setSfx('win');
            break;
        case 'win':
        case 'dealerBust':
            winnings = bet * 2; // Return bet + 1x
            setMessage(result === 'dealerBust' ? 'DEALER CRASHED. YOU WIN.' : 'HAND WON.');
            setSfx('win');
            break;
        case 'push':
            winnings = bet; // Return bet
            setMessage('TIE. CREDITS REFUNDED.');
            setSfx('push');
            break;
        case 'bust':
            setMessage('CRITICAL FAILURE: BUST.');
            setSfx('lose');
            break;
        case 'lose':
            setMessage('DEALER WINS. CONNECTION TERMINATED.');
            setSfx('lose');
            break;
    }

    if (winnings > 0) {
        updateUserScore(winnings);
        onScoreUpdate(user.totalScore + winnings);
    }
  };

  const CardView = ({ card, hidden = false }: { card: Card, hidden?: boolean }) => {
     if (hidden) {
         return (
             <div className="w-16 h-24 sm:w-20 sm:h-28 bg-zinc-900 border border-zinc-700 rounded-sm flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                 <div className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-600 animate-spin-slow"></div>
             </div>
         );
     }
     
     const isRed = ['♥', '♦'].includes(card.suit);
     return (
         <div className={`
            w-16 h-24 sm:w-20 sm:h-28 bg-black border-2 rounded-sm flex flex-col justify-between p-2 relative group transition-all duration-300 transform hover:-translate-y-2
            ${isRed ? 'border-red-900 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-cyan-900 text-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]'}
         `}>
             <div className="text-sm font-black font-mono">{card.rank}</div>
             <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20">{card.suit}</div>
             <div className="text-right text-lg">{card.suit}</div>
         </div>
     );
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in pb-20">
      {/* Header / Stats */}
      <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                <span className="text-pink-500">NET</span>RUNNER <span className="text-cyan-400">CASINO</span>
            </h2>
            <p className="text-xs text-zinc-500 font-mono">PROTOCOL: BLACKJACK // WAGER: REPUTATION</p>
          </div>
          <div className="text-right">
             <div className="text-xs text-zinc-500 font-mono uppercase">Current Balance</div>
             <div className="text-2xl font-bold text-yellow-400 font-mono">{user.totalScore} REP</div>
          </div>
      </div>

      {/* Main Game Area */}
      <div className="bg-[#080808] border border-zinc-800 relative min-h-[400px] flex flex-col items-center justify-center p-4 sm:p-8 rounded-lg overflow-hidden">
        
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_1px,transparent_1px)] bg-[size:40px_40px] [background-position:center] opacity-20 pointer-events-none"></div>

        {gameState === 'betting' ? (
             <div className="relative z-10 w-full max-w-md text-center space-y-6">
                 <Dices className="w-16 h-16 mx-auto text-pink-500 mb-4 animate-pulse" />
                 <h3 className="text-xl font-bold text-white uppercase tracking-widest">Place Your Wager</h3>
                 
                 <div className="flex items-center justify-center space-x-2">
                     <button onClick={() => setTempBetInput(Math.max(10, parseInt(tempBetInput) - 10).toString())} className="p-2 border border-zinc-700 hover:border-cyan-400 text-zinc-400 hover:text-cyan-400 transition">-</button>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">$</span>
                        <input 
                            type="number" 
                            value={tempBetInput}
                            onChange={(e) => setTempBetInput(e.target.value)}
                            className="w-32 bg-black border border-zinc-700 py-2 pl-6 pr-2 text-center text-white font-mono font-bold focus:border-cyan-400 outline-none"
                        />
                     </div>
                     <button onClick={() => setTempBetInput((parseInt(tempBetInput) + 10).toString())} className="p-2 border border-zinc-700 hover:border-cyan-400 text-zinc-400 hover:text-cyan-400 transition">+</button>
                 </div>
                 
                 <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                     <button onClick={() => setTempBetInput('10')} className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 py-1">10</button>
                     <button onClick={() => setTempBetInput('50')} className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 py-1">50</button>
                     <button onClick={() => setTempBetInput('100')} className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 py-1">100</button>
                     <button onClick={() => setTempBetInput(user.totalScore.toString())} className="bg-zinc-900 border border-zinc-700 hover:border-yellow-400 hover:text-yellow-400 py-1 text-yellow-600">ALL</button>
                 </div>

                 {message && <div className="text-red-500 text-xs font-mono bg-red-900/20 p-2 border border-red-900">{message}</div>}

                 <button 
                    onClick={placeBet}
                    disabled={user.totalScore <= 0}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                     INITIATE HAND
                 </button>

                 {user.totalScore <= 0 && (
                     <div className="mt-8 border-t border-zinc-800 pt-6">
                         <div className="flex items-center justify-center text-yellow-500 mb-2">
                             <AlertTriangle className="w-4 h-4 mr-2" />
                             <span className="text-xs font-bold uppercase">Wallet Depleted</span>
                         </div>
                         <button 
                            onClick={handleFaucet}
                            className="text-xs font-mono border border-dashed border-zinc-600 hover:border-green-500 hover:text-green-500 px-4 py-2 flex items-center mx-auto transition-colors"
                         >
                            <CreditCard className="w-3 h-3 mr-2" />
                            HACK LOAN SERVER (+50)
                         </button>
                     </div>
                 )}
             </div>
        ) : (
            <div className="w-full relative z-10 flex flex-col justify-between min-h-[400px]">
                {/* Dealer Area */}
                <div className="flex flex-col items-center mb-8">
                    <div className="text-xs font-mono text-zinc-500 mb-2 uppercase tracking-widest">System (Dealer)</div>
                    <div className="flex space-x-2 sm:space-x-4">
                        {dealerHand.map((card, idx) => (
                            <CardView 
                                key={idx} 
                                card={card} 
                                hidden={gameState === 'playing' && idx === 1} 
                            />
                        ))}
                    </div>
                    {gameState !== 'playing' && (
                        <div className="mt-2 text-zinc-400 font-mono text-sm">
                            Total: <span className="text-white font-bold">{calculateScore(dealerHand)}</span>
                        </div>
                    )}
                </div>

                {/* Game Status Message */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none">
                    {gameState === 'gameOver' && (
                        <div className="inline-block bg-black/90 border-y border-zinc-500 px-8 py-3 animate-fade-in-up">
                            <h2 className={`text-2xl font-black uppercase italic ${sfx === 'win' ? 'text-green-400' : sfx === 'lose' ? 'text-red-500' : 'text-yellow-400'}`}>
                                {message}
                            </h2>
                        </div>
                    )}
                </div>

                {/* Player Area */}
                <div className="flex flex-col items-center mt-auto">
                    <div className="text-xs font-mono text-zinc-500 mb-2 uppercase tracking-widest flex items-center">
                        Runner (You) 
                        <span className="ml-2 bg-zinc-800 text-zinc-300 px-1 text-[10px]">Bet: {bet}</span>
                    </div>
                    <div className="flex space-x-2 sm:space-x-4 mb-4">
                         {playerHand.map((card, idx) => (
                            <CardView key={idx} card={card} />
                        ))}
                    </div>
                    <div className="mb-6 text-zinc-400 font-mono text-sm">
                        Total: <span className="text-cyan-400 font-bold">{calculateScore(playerHand)}</span>
                    </div>

                    {/* Controls */}
                    {gameState === 'playing' ? (
                        <div className="flex space-x-4">
                            <button 
                                onClick={hit}
                                className="px-8 py-3 bg-zinc-900 border border-red-500/50 hover:border-red-500 text-red-500 font-bold uppercase tracking-widest hover:bg-red-950/30 transition-all flex items-center"
                            >
                                <TrendingUp className="w-4 h-4 mr-2" /> HIT
                            </button>
                            <button 
                                onClick={stand}
                                className="px-8 py-3 bg-zinc-900 border border-green-500/50 hover:border-green-500 text-green-500 font-bold uppercase tracking-widest hover:bg-green-950/30 transition-all flex items-center"
                            >
                                <Hand className="w-4 h-4 mr-2" /> STAND
                            </button>
                        </div>
                    ) : (
                        gameState === 'gameOver' && (
                            <button 
                                onClick={() => setGameState('betting')}
                                className="px-8 py-3 bg-yellow-400 text-black font-black uppercase tracking-widest hover:bg-yellow-300 transition-all shadow-[0_0_15px_rgba(250,204,21,0.5)] flex items-center"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" /> NEW HAND
                            </button>
                        )
                    )}
                </div>
            </div>
        )}
      </div>
      
      <div className="mt-4 text-center">
          <p className="text-[10px] text-zinc-600 font-mono uppercase">
              // NOTICE: High-stakes environment. House always has edge in the long run.
          </p>
      </div>
    </div>
  );
};

export default BlackjackGame;