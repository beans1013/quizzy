import React, { useState, useEffect } from 'react';
import { parseQuizJSON, parseQuizString, PROMPT_TEMPLATE } from './services/geminiService';
import { AppStatus, QuizData } from './types';
import FileUpload from './components/FileUpload';
import QuizCard from './components/QuizCard';
import { BookOpen, RefreshCw, Award, ArrowRight, Copy, Check, Moon, Sun, FileText, Upload } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [jsonText, setJsonText] = useState('');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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

  const handleTextLoad = () => {
    if (!jsonText.trim()) return;
    setStatus(AppStatus.PROCESSING);
    try {
        const data = parseQuizString(jsonText);
        setQuizData(data);
        setStatus(AppStatus.QUIZ_READY);
        setUserAnswers({});
        setScore(0);
    } catch (error) {
        console.error(error);
        alert(error instanceof Error ? error.message : "Failed to parse text");
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
              UniTutor
            </span>
          </div>
          
          <div className="flex items-center gap-4">
             <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
             >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             
             {status !== AppStatus.IDLE && (
                <button 
                  onClick={handleReset}
                  className="text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  New Quiz
                </button>
              )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container max-w-5xl mx-auto px-4 py-8">
        
        {status === AppStatus.IDLE || status === AppStatus.PROCESSING || status === AppStatus.ERROR ? (
          <div className="animate-fade-in-up">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
                JSON Quiz Generator
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Use your favorite AI (ChatGPT, Claude, Gemini) to generate a quiz, then load the result here.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Step 1: Prompt Template */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-full transition-colors duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold text-sm">1</span>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Copy Master Prompt</h2>
                  </div>
                  <button 
                    onClick={handleCopyPrompt}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${copied ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50'}`}
                  >
                    {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Paste this into any AI chat along with your exam content or topic.
                </p>
                <div className="relative flex-grow">
                  <textarea 
                    readOnly
                    className="w-full h-64 p-4 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600"
                    value={PROMPT_TEMPLATE}
                  />
                </div>
              </div>

              {/* Step 2: Input Method */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-full transition-colors duration-300">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center space-x-3">
                     <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold text-sm">2</span>
                     <h2 className="text-lg font-bold text-slate-800 dark:text-white">Load Quiz</h2>
                   </div>
                   
                   {/* Input Mode Toggle */}
                   <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                      <button
                        onClick={() => setInputMode('upload')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${inputMode === 'upload' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                         <Upload className="w-3 h-3 inline mr-1" /> Upload
                      </button>
                      <button
                        onClick={() => setInputMode('paste')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${inputMode === 'paste' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                         <FileText className="w-3 h-3 inline mr-1" /> Paste Text
                      </button>
                   </div>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                   {inputMode === 'upload' ? 'Upload the .json file generated by the AI.' : 'Paste the JSON code directly below.'}
                </p>
                
                <div className="flex-grow flex flex-col">
                  {inputMode === 'upload' ? (
                     <FileUpload 
                        onFileSelect={handleFileSelect} 
                        isProcessing={status === AppStatus.PROCESSING} 
                     />
                  ) : (
                    <div className="flex flex-col h-full">
                       <textarea 
                          className="flex-grow w-full p-4 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none mb-4"
                          placeholder='Paste JSON here... {"title": "...", "questions": [...] }'
                          value={jsonText}
                          onChange={(e) => setJsonText(e.target.value)}
                       />
                       <button
                          onClick={handleTextLoad}
                          disabled={!jsonText.trim() || status === AppStatus.PROCESSING}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                          Load Quiz
                       </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {(status === AppStatus.QUIZ_READY || status === AppStatus.QUIZ_COMPLETED) && quizData && (
          <div className="space-y-8 animate-fade-in max-w-3xl mx-auto mt-6">
            {/* Quiz Info */}
            <div className="bg-indigo-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
               <div className="relative z-10">
                 <h2 className="text-3xl font-bold mb-2">{quizData.title}</h2>
                 <p className="text-indigo-200 mb-6">
                   {quizData.questions.length} Questions • Multiple Choice
                 </p>
                 
                 {status === AppStatus.QUIZ_COMPLETED && (
                    <div className="inline-flex items-center bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                       <Award className="w-8 h-8 text-yellow-300 mr-3" />
                       <div>
                          <p className="text-xs text-indigo-200 uppercase tracking-wide font-semibold">Your Score</p>
                          <p className="text-2xl font-bold">{score} <span className="text-lg font-normal text-indigo-300">/ {quizData.questions.length}</span></p>
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
              <div className="sticky bottom-8 flex justify-center pb-8">
                 <button 
                  onClick={handleSubmitQuiz}
                  disabled={!allQuestionsAnswered}
                  className={`
                    px-8 py-4 rounded-full font-bold text-lg shadow-lg flex items-center transition-all transform hover:scale-105
                    ${allQuestionsAnswered ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'}
                  `}
                 >
                   Submit Quiz <ArrowRight className="ml-2 w-5 h-5" />
                 </button>
              </div>
            )}
            
            {status === AppStatus.QUIZ_COMPLETED && (
               <div className="flex justify-center pb-12">
                  <button onClick={handleReset} className="px-8 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                     Load Another Quiz
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