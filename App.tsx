import React, { useState, useEffect } from 'react';
import { parseQuizJSON, parseQuizString, PROMPT_TEMPLATE } from './services/geminiService';
import { initializeUser, recoverUser, updateUserScore, updateUsername } from './services/authService';
import { AppStatus, QuizData, UserProfile } from './types';
import FileUpload from './components/FileUpload';
import QuizCard from './components/QuizCard';
import BlackjackGame from './components/BlackjackGame';
import { Terminal, RefreshCw, Trophy, ArrowRight, Copy, Check, FileCode, Zap, Clock, AlertTriangle, User, ShieldAlert, LogIn, Star, Edit2, X, BrainCircuit, Dices } from 'lucide-react';

const TIME_PER_QUESTION_SEC = 300;

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [rawScore, setRawScore] = useState(0);
  const [copied, setCopied] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  
  // User Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showRecoveryWarning, setShowRecoveryWarning] = useState(true);
  const [showLoginInput, setShowLoginInput] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  
  // Username Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'quiz' | 'casino'>('quiz');

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);
  
  // Input method state
  const [inputMethod, setInputMethod] = useState<'upload' | 'paste'>('upload');
  const [jsonText, setJsonText] = useState('');

  // Initialize Auth
  useEffect(() => {
    const currentUser = initializeUser();
    setUser(currentUser);
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === AppStatus.QUIZ_READY && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsOvertime(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startQuiz = (data: QuizData) => {
    setQuizData(data);
    setStatus(AppStatus.QUIZ_READY);
    setUserAnswers({});
    setScore(0);
    setRawScore(0);
    // Initialize Timer
    setTimeLeft(data.questions.length * TIME_PER_QUESTION_SEC);
    setIsOvertime(false);
  };

  const handleFileSelect = async (file: File) => {
    setStatus(AppStatus.PROCESSING);
    try {
      const data = await parseQuizJSON(file);
      startQuiz(data);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to parse file");
      setStatus(AppStatus.ERROR);
      setTimeout(() => setStatus(AppStatus.IDLE), 3000);
    }
  };

  const handleTextSubmit = () => {
    setStatus(AppStatus.PROCESSING);
    try {
      const data = parseQuizString(jsonText);
      startQuiz(data);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to parse JSON text");
      setStatus(AppStatus.ERROR);
      setTimeout(() => setStatus(AppStatus.IDLE), 3000);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyKey = () => {
    if (user) {
        navigator.clipboard.writeText(user.recoveryKey);
        setKeyCopied(true);
        setTimeout(() => setKeyCopied(false), 2000);
    }
  };

  const handleLogin = () => {
      const recovered = recoverUser(recoveryInput);
      if (recovered) {
          setUser(recovered);
          setShowLoginInput(false);
          setRecoveryInput('');
          handleReset();
          alert("IDENTITY RESTORED. WELCOME BACK, NETRUNNER.");
      } else {
          alert("INVALID KEY FORMAT. ACCESS DENIED.");
      }
  };

  const handleStartEditName = () => {
      if (user) {
          setTempName(user.id);
          setIsEditingName(true);
      }
  };

  const handleSaveName = () => {
      const result = updateUsername(tempName);
      if (result.success && result.user) {
          setUser(result.user);
          setIsEditingName(false);
      } else {
          alert(`ERROR: ${result.error}`);
      }
  };

  const handleCancelEditName = () => {
      setIsEditingName(false);
  };

  const handleOptionSelect = (questionId: number, optionIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitQuiz = () => {
    if (!quizData) return;
    
    let currentRawScore = 0;
    quizData.questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswerIndex) {
        currentRawScore++;
      }
    });
    
    setRawScore(currentRawScore);

    // Apply Penalty
    let finalScore = currentRawScore;
    if (isOvertime) {
        const penalty = Math.ceil(quizData.questions.length * 0.2); // 20% penalty
        finalScore = Math.max(0, currentRawScore - penalty);
    }

    setScore(finalScore);
    
    // Update User Score persistently
    const updatedUser = updateUserScore(finalScore);
    if (updatedUser) {
        setUser(updatedUser);
    }

    setStatus(AppStatus.QUIZ_COMPLETED);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setQuizData(null);
    setUserAnswers({});
    setScore(0);
    setRawScore(0);
    setJsonText('');
    setTimeLeft(0);
    setIsOvertime(false);
  };

  const handleScoreUpdate = (newScore: number) => {
      if (user) {
          setUser({ ...user, totalScore: newScore });
      }
  };

  const allQuestionsAnswered = quizData?.questions.every(q => userAnswers[q.id] !== undefined);

  return (
    <div className="min-h-screen bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-[#050505] flex flex-col font-sans text-zinc-300">
      
      {/* Decorative Top Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400"></div>

      {/* Header */}
      <header className="bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={handleReset}>
            <div className="bg-yellow-400 p-1.5 transform skew-x-[-12deg] group-hover:bg-cyan-400 transition-colors">
              <Terminal className="w-5 h-5 text-black transform skew-x-[12deg]" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase text-white group-hover:text-cyan-400 transition-colors hidden sm:inline">
              Quizzy<span className="text-yellow-400">.OS</span>
            </span>
          </div>

           {/* Tab Navigation */}
           <div className="hidden md:flex items-center space-x-1 bg-zinc-900/50 p-1 border border-zinc-800 rounded-sm">
              <button 
                onClick={() => setActiveTab('quiz')}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center transition-all ${activeTab === 'quiz' ? 'bg-cyan-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                  <BrainCircuit className="w-3 h-3 mr-2" />
                  Simulations
              </button>
              <button 
                onClick={() => setActiveTab('casino')}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center transition-all ${activeTab === 'casino' ? 'bg-pink-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                  <Dices className="w-3 h-3 mr-2" />
                  Rec Room
              </button>
           </div>

          <div className="flex items-center space-x-4">
            {/* Timer Display (Only in Quiz) */}
            {status === AppStatus.QUIZ_READY && activeTab === 'quiz' && (
                <div className={`
                    flex items-center space-x-2 px-4 py-1.5 border-2 rounded-sm font-mono font-bold text-lg tracking-widest hidden lg:flex
                    ${isOvertime 
                        ? 'border-red-500 bg-red-950/20 text-red-500 animate-pulse' 
                        : timeLeft < 30 
                            ? 'border-orange-500 text-orange-500' 
                            : 'border-zinc-800 text-cyan-400 bg-zinc-900/50'}
                `}>
                    <Clock className="w-4 h-4" />
                    <span>{isOvertime ? "OVERTIME" : formatTime(timeLeft)}</span>
                </div>
            )}

            {/* User Identity Display */}
            {user && (
                <div className="hidden md:flex items-center bg-black/50 border border-zinc-800 divide-x divide-zinc-800">
                    <div className="px-3 py-1 flex items-center space-x-2 group relative">
                         <User className="w-3 h-3 text-zinc-500" />
                         <span className="font-mono text-xs text-zinc-400 whitespace-nowrap">ID:</span>
                         
                         {isEditingName ? (
                             <div className="flex items-center space-x-1">
                                 <input 
                                    type="text" 
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="bg-black text-cyan-400 text-xs font-bold font-mono border-b border-cyan-500 focus:outline-none w-24"
                                    autoFocus
                                    maxLength={16}
                                 />
                                 <button onClick={handleSaveName} className="text-green-500 hover:text-green-400"><Check className="w-3 h-3" /></button>
                                 <button onClick={handleCancelEditName} className="text-red-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                             </div>
                         ) : (
                             <div className="flex items-center space-x-2 group-hover:text-cyan-400 transition-colors">
                                <span className="text-white font-bold font-mono text-xs max-w-[100px] truncate">{user.id}</span>
                                <button onClick={handleStartEditName} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-yellow-400">
                                    <Edit2 className="w-3 h-3" />
                                </button>
                             </div>
                         )}
                    </div>
                    <div className="px-3 py-1 flex items-center space-x-2">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span className="font-mono text-xs text-zinc-400">REP: <span className="text-yellow-400 font-bold">{user.totalScore}</span></span>
                    </div>
                </div>
            )}

            {status !== AppStatus.IDLE && activeTab === 'quiz' && (
                <button 
                onClick={handleReset}
                className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-yellow-400 border border-transparent hover:border-yellow-400 transition-all flex items-center"
                >
                <RefreshCw className="w-3 h-3 mr-2" />
                <span className="hidden sm:inline">Reset System</span>
                </button>
            )}
          </div>
        </div>
        
        {/* Mobile Tab Nav */}
        <div className="md:hidden flex border-t border-zinc-800">
             <button 
                onClick={() => setActiveTab('quiz')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center ${activeTab === 'quiz' ? 'bg-zinc-800 text-cyan-400' : 'bg-black text-zinc-500'}`}
              >
                  <BrainCircuit className="w-3 h-3 mr-2" />
                  Simulations
              </button>
              <button 
                onClick={() => setActiveTab('casino')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center ${activeTab === 'casino' ? 'bg-zinc-800 text-pink-500' : 'bg-black text-zinc-500'}`}
              >
                  <Dices className="w-3 h-3 mr-2" />
                  Rec Room
              </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container max-w-6xl mx-auto px-4 py-8">
        
        {/* Auth Warning / Recovery Banner (Only show on Idle Quiz or Casino) */}
        {user && showRecoveryWarning && (status === AppStatus.IDLE || activeTab === 'casino') && (
            <div className="mb-8 border border-yellow-400/50 bg-yellow-400/5 p-4 relative animate-fade-in group">
                 <button 
                   onClick={() => setShowRecoveryWarning(false)}
                   className="absolute top-2 right-2 text-zinc-600 hover:text-yellow-400"
                 >
                     <span className="sr-only">Dismiss</span>
                     <div className="text-[10px] font-mono border border-zinc-700 px-2 hover:border-yellow-400">ACKNOWLEDGE</div>
                 </button>
                 
                 <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="bg-yellow-400/10 p-2 rounded-full border border-yellow-400/20 text-yellow-400 animate-pulse">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div className="flex-grow">
                        <h3 className="text-yellow-400 font-bold uppercase tracking-wider text-sm flex items-center">
                            Warning: Volatile Memory Detected
                        </h3>
                        <p className="text-xs text-zinc-400 font-mono mt-1 max-w-2xl">
                            You are operating in Guest Mode. Clearing your browser cache will erase your identity.
                            To restore your session later, save this Recovery Key:
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                             <code className="bg-black border border-zinc-700 px-3 py-1.5 text-cyan-400 font-mono text-sm tracking-widest select-all">
                                 {user.recoveryKey}
                             </code>
                             <button 
                                onClick={handleCopyKey}
                                className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                                title="Copy Key"
                             >
                                 {keyCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                             </button>
                        </div>
                    </div>
                    
                    <div className="hidden md:block h-12 w-px bg-zinc-800 mx-4"></div>
                    
                    <div className="mt-4 md:mt-0 flex-shrink-0">
                         <button 
                           onClick={() => setShowLoginInput(!showLoginInput)}
                           className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-cyan-400 flex items-center"
                         >
                             <LogIn className="w-3 h-3 mr-1" /> Existing User?
                         </button>
                    </div>
                 </div>

                 {showLoginInput && (
                     <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-2">
                         <input 
                            type="text" 
                            placeholder="enter-recovery-key-here"
                            value={recoveryInput}
                            onChange={(e) => setRecoveryInput(e.target.value)}
                            className="bg-black border border-zinc-700 text-white font-mono text-xs p-2 flex-grow focus:border-cyan-400 outline-none"
                         />
                         <button 
                            onClick={handleLogin}
                            disabled={!recoveryInput}
                            className="bg-zinc-800 hover:bg-cyan-600 hover:text-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                         >
                             Load Profile
                         </button>
                     </div>
                 )}
            </div>
        )}

        {/* Tab Content Rendering */}
        {activeTab === 'casino' ? (
             user ? <BlackjackGame user={user} onScoreUpdate={handleScoreUpdate} /> : null
        ) : (
            <>
                {status === AppStatus.IDLE || status === AppStatus.PROCESSING || status === AppStatus.ERROR ? (
                <div className="animate-fade-in-up">
                    <div className="text-center max-w-3xl mx-auto mb-16 relative">
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter leading-none relative z-10">
                        JSON <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">Quiz</span> Generator
                    </h1>
                    <div className="h-px w-24 bg-cyan-500 mx-auto mb-6 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                    <p className="text-zinc-400 font-mono text-sm md:text-base max-w-xl mx-auto">
                        // SYSTEM: Initialize external AI model (ChatGPT, Claude, Gemini).<br/>
                        // PROCESS: Generate Quiz JSON.<br/>
                        // INPUT: Inject data below for rendering.
                    </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Step 1: Prompt Template */}
                    <div className="bg-zinc-900 border border-zinc-800 p-1 relative group hover:border-zinc-600 transition-colors h-full flex flex-col">
                        {/* Decoration */}
                        <div className="absolute top-0 right-0 p-2 opacity-50">
                            <div className="text-[10px] font-mono text-zinc-600">PHASE_01</div>
                        </div>

                        <div className="bg-[#050505] p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <span className="flex items-center justify-center w-6 h-6 bg-yellow-400 text-black font-bold text-xs font-mono">01</span>
                                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">Acquire Protocol</h2>
                                </div>
                                <button 
                                    onClick={handleCopyPrompt}
                                    className={`flex items-center px-4 py-1.5 text-xs font-bold uppercase tracking-widest border transition-all ${copied ? 'border-green-500 text-green-500 bg-green-900/10' : 'border-zinc-700 text-zinc-400 hover:border-cyan-400 hover:text-cyan-400'}`}
                                >
                                    {copied ? <Check className="w-3 h-3 mr-2" /> : <Copy className="w-3 h-3 mr-2" />}
                                    {copied ? 'COPIED' : 'COPY PROMPT'}
                                </button>
                            </div>
                            
                            <div className="relative flex-grow group-hover:shadow-[0_0_20px_rgba(250,204,21,0.05)] transition-shadow">
                                <div className="absolute inset-0 bg-zinc-800/20 pointer-events-none border border-zinc-800/50"></div>
                                <textarea 
                                    readOnly
                                    className="w-full h-80 p-4 text-xs font-mono bg-[#0a0a0a] border border-zinc-800 text-zinc-400 focus:outline-none resize-none leading-relaxed custom-scrollbar selection:bg-cyan-900 selection:text-cyan-100"
                                    value={PROMPT_TEMPLATE}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Input Data */}
                    <div className="bg-zinc-900 border border-zinc-800 p-1 relative group hover:border-zinc-600 transition-colors h-full flex flex-col">
                        <div className="absolute top-0 right-0 p-2 opacity-50">
                            <div className="text-[10px] font-mono text-zinc-600">PHASE_02</div>
                        </div>

                        <div className="bg-[#050505] p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <span className="flex items-center justify-center w-6 h-6 bg-cyan-400 text-black font-bold text-xs font-mono">02</span>
                                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">Inject Data</h2>
                                </div>
                                <div className="flex bg-zinc-900 border border-zinc-800 p-1">
                                    <button 
                                        onClick={() => setInputMethod('upload')}
                                        className={`px-4 py-1 text-[10px] font-bold uppercase tracking-widest transition-all ${inputMethod === 'upload' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        File
                                    </button>
                                    <button 
                                        onClick={() => setInputMethod('paste')}
                                        className={`px-4 py-1 text-[10px] font-bold uppercase tracking-widest transition-all ${inputMethod === 'paste' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        Text
                                    </button>
                                </div>
                            </div>

                            {inputMethod === 'upload' ? (
                            <div className="flex-grow flex flex-col">
                                <p className="text-xs font-mono text-zinc-500 mb-4 border-l-2 border-zinc-800 pl-2">
                                    // UPLOAD .JSON FILE
                                </p>
                                <div className="flex-grow">
                                <FileUpload 
                                    onFileSelect={handleFileSelect} 
                                    isProcessing={status === AppStatus.PROCESSING} 
                                />
                                </div>
                            </div>
                            ) : (
                            <div className="flex-grow flex flex-col">
                                <p className="text-xs font-mono text-zinc-500 mb-4 border-l-2 border-zinc-800 pl-2">
                                    // PASTE RAW JSON DATA
                                </p>
                                <textarea 
                                    className="w-full flex-grow p-4 text-xs font-mono bg-[#0a0a0a] border border-zinc-700 text-cyan-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] mb-4 resize-none min-h-[250px] transition-all placeholder-zinc-700"
                                    placeholder='{ "title": "Calculus I", "questions": [...] }'
                                    value={jsonText}
                                    onChange={(e) => setJsonText(e.target.value)}
                                />
                                <button
                                    onClick={handleTextSubmit}
                                    disabled={!jsonText.trim() || status === AppStatus.PROCESSING}
                                    className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
                                >
                                    {status === AppStatus.PROCESSING ? (
                                    <span className="animate-pulse">PROCESSING...</span>
                                    ) : (
                                    <><FileCode className="w-4 h-4 mr-2" /> INITIALIZE QUIZ</>
                                    )} 
                                </button>
                            </div>
                            )}
                        </div>
                    </div>
                    </div>
                </div>
                ) : null}

                {(status === AppStatus.QUIZ_READY || status === AppStatus.QUIZ_COMPLETED) && quizData && (
                <div className="space-y-12 animate-fade-in max-w-4xl mx-auto mt-6">
                    {/* Quiz Info */}
                    <div className={`relative border p-8 overflow-hidden transition-colors ${isOvertime && status === AppStatus.QUIZ_READY ? 'border-red-500 bg-red-950/20' : 'border-zinc-700 bg-zinc-900/50'}`}>
                    <div className="absolute top-0 left-0 w-20 h-1 bg-yellow-400"></div>
                    <div className="absolute bottom-0 right-0 w-20 h-1 bg-cyan-400"></div>
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                            <Zap className="w-24 h-24 text-white" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-2 uppercase tracking-tighter italic">
                                {quizData.title}
                            </h2>
                            <p className="text-zinc-400 font-mono text-sm uppercase tracking-widest border-l-2 border-yellow-400 pl-3">
                                Total Items: <span className="text-white">{quizData.questions.length}</span> // Difficulty: <span className="text-white">HARD</span>
                            </p>
                        </div>
                        
                        {status === AppStatus.QUIZ_COMPLETED && (
                            <div className="flex flex-col items-end gap-2">
                            {isOvertime && (
                                <div className="flex items-center space-x-2 text-red-500 font-mono text-xs uppercase font-bold bg-red-950/50 px-2 py-1 border border-red-500/50">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>TIME PENALTY APPLIED (-{Math.ceil(quizData.questions.length * 0.2)})</span>
                                </div>
                            )}
                            <div className="flex items-center border border-zinc-600 bg-black/40 p-4 min-w-[200px]">
                                <Trophy className={`w-8 h-8 mr-4 ${isOvertime ? 'text-red-500' : 'text-yellow-400'}`} />
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Final Grade</p>
                                    <p className="text-3xl font-black text-white leading-none">
                                        {score} <span className="text-lg text-zinc-600 font-normal">/ {quizData.questions.length}</span>
                                    </p>
                                </div>
                            </div>
                            </div>
                        )}
                    </div>
                    </div>

                    {/* Questions List */}
                    <div>
                    {quizData.questions.map((question) => (
                        <QuizCard
                        key={question.id}
                        question={question}
                        selectedOptionIndex={userAnswers[question.id]}
                        onSelectOption={(idx) => handleOptionSelect(question.id, idx)}
                        showResult={status === AppStatus.QUIZ_COMPLETED}
                        />
                    ))}
                    </div>

                    {/* Actions */}
                    {status === AppStatus.QUIZ_READY && (
                    <div className="sticky bottom-8 flex justify-center pb-8 z-40 pointer-events-none">
                        <button 
                        onClick={handleSubmitQuiz}
                        disabled={!allQuestionsAnswered}
                        className={`
                            pointer-events-auto
                            px-10 py-4 font-black text-xl uppercase tracking-widest flex items-center transition-all transform hover:-translate-y-1 active:translate-y-0
                            ${allQuestionsAnswered 
                                ? isOvertime ? 'bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] border-2 border-red-400' : 'bg-yellow-400 text-black shadow-[0_0_30px_rgba(250,204,21,0.5)] hover:shadow-[0_0_50px_rgba(250,204,21,0.8)] border-2 border-transparent' 
                                : 'bg-zinc-900 border-2 border-zinc-700 text-zinc-600 cursor-not-allowed'}
                        `}
                        >
                        Submit Data <ArrowRight className="ml-3 w-6 h-6" />
                        </button>
                    </div>
                    )}
                    
                    {status === AppStatus.QUIZ_COMPLETED && (
                    <div className="flex justify-center pb-16">
                        <button 
                            onClick={handleReset} 
                            className="px-8 py-3 bg-transparent border border-cyan-500 text-cyan-400 font-bold uppercase tracking-widest hover:bg-cyan-950/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
                        >
                            Run New Simulation
                        </button>
                    </div>
                    )}
                </div>
                )}
            </>
        )}
      </main>
    </div>
  );
};

export default App;