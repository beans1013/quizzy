import React, { useState } from 'react';
import { parseQuizJSON, parseQuizString, PROMPT_TEMPLATE } from './services/geminiService';
import { AppStatus, QuizData } from './types';
import FileUpload from './components/FileUpload';
import QuizCard from './components/QuizCard';
import { Terminal, RefreshCw, Trophy, ArrowRight, Copy, Check, FileCode, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [copied, setCopied] = useState(false);
  
  // Input method state
  const [inputMethod, setInputMethod] = useState<'upload' | 'paste'>('upload');
  const [jsonText, setJsonText] = useState('');

  const handleFileSelect = async (file: File) => {
    setStatus(AppStatus.PROCESSING);
    try {
      const data = await parseQuizJSON(file);
      setQuizData(data);
      setStatus(AppStatus.QUIZ_READY);
      setUserAnswers({});
      setScore(0);
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
      setQuizData(data);
      setStatus(AppStatus.QUIZ_READY);
      setUserAnswers({});
      setScore(0);
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

  const handleOptionSelect = (questionId: number, optionIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitQuiz = () => {
    if (!quizData) return;
    
    let currentScore = 0;
    quizData.questions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswerIndex) {
        currentScore++;
      }
    });
    setScore(currentScore);
    setStatus(AppStatus.QUIZ_COMPLETED);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setQuizData(null);
    setUserAnswers({});
    setScore(0);
    setJsonText('');
  };

  const allQuestionsAnswered = quizData?.questions.every(q => userAnswers[q.id] !== undefined);

  return (
    <div className="min-h-screen bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-[#050505] flex flex-col font-sans text-zinc-300">
      
      {/* Decorative Top Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400"></div>

      {/* Header */}
      <header className="bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={handleReset}>
            <div className="bg-yellow-400 p-1.5 transform skew-x-[-12deg] group-hover:bg-cyan-400 transition-colors">
              <Terminal className="w-5 h-5 text-black transform skew-x-[12deg]" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase text-white group-hover:text-cyan-400 transition-colors">
              Quizzy<span className="text-yellow-400">.OS</span>
            </span>
          </div>
          {status !== AppStatus.IDLE && (
            <button 
              onClick={handleReset}
              className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-yellow-400 border border-transparent hover:border-yellow-400 transition-all flex items-center"
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Reset System
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container max-w-6xl mx-auto px-4 py-12">
        
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
            <div className="relative border border-zinc-700 bg-zinc-900/50 p-8 overflow-hidden">
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
                    <div className="flex items-center border border-zinc-600 bg-black/40 p-4 min-w-[200px]">
                       <Trophy className="w-8 h-8 text-yellow-400 mr-4" />
                       <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Performance</p>
                          <p className="text-3xl font-black text-white leading-none">
                              {score} <span className="text-lg text-zinc-600 font-normal">/ {quizData.questions.length}</span>
                          </p>
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
                        ? 'bg-yellow-400 text-black shadow-[0_0_30px_rgba(250,204,21,0.5)] hover:shadow-[0_0_50px_rgba(250,204,21,0.8)] border-2 border-transparent' 
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
      </main>
    </div>
  );
};

export default App;