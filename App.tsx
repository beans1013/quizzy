import React, { useState } from 'react';
import { generateQuizFromPDF } from './services/geminiService';
import { AppStatus, QuizData } from './types';
import FileUpload from './components/FileUpload';
import QuizCard from './components/QuizCard';
import { BookOpen, RefreshCw, Award, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);

  const handleFileSelect = async (file: File) => {
    setStatus(AppStatus.PROCESSING);
    try {
      const data = await generateQuizFromPDF(file);
      setQuizData(data);
      setStatus(AppStatus.QUIZ_READY);
      setUserAnswers({});
      setScore(0);
    } catch (error) {
      console.error(error);
      setStatus(AppStatus.ERROR);
      setTimeout(() => setStatus(AppStatus.IDLE), 3000);
    }
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
  };

  const allQuestionsAnswered = quizData?.questions.every(q => userAnswers[q.id] !== undefined);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              UniTutor
            </span>
          </div>
          {status !== AppStatus.IDLE && (
            <button 
              onClick={handleReset}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              New Quiz
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container max-w-3xl mx-auto px-4 py-12">
        
        {status === AppStatus.IDLE && (
          <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in-up">
            <div className="text-center max-w-2xl">
              <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Master your <span className="text-indigo-600">Math & Chemistry</span> exams
              </h1>
              <p className="text-lg text-slate-600">
                Upload your course PDF (exam paper, notes, or worksheet). Our AI will instantly generate a challenging quiz with step-by-step LaTeX solutions.
              </p>
            </div>
            <FileUpload onFileSelect={handleFileSelect} isProcessing={false} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-12">
               <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600 font-bold">∑</div>
                  <h3 className="font-semibold text-slate-800">LaTeX Rendering</h3>
                  <p className="text-sm text-slate-500 mt-2">Beautifully rendered mathematical equations and chemical formulas.</p>
               </div>
               <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-purple-600 font-bold">AI</div>
                  <h3 className="font-semibold text-slate-800">Smart Distractors</h3>
                  <p className="text-sm text-slate-500 mt-2">Options generated to challenge common misconceptions.</p>
               </div>
               <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 text-emerald-600 font-bold">✓</div>
                  <h3 className="font-semibold text-slate-800">Instant Grading</h3>
                  <p className="text-sm text-slate-500 mt-2">Immediate feedback with detailed explanations for every question.</p>
               </div>
            </div>
          </div>
        )}

        {status === AppStatus.PROCESSING && (
           <div className="flex flex-col items-center justify-center pt-20">
              <FileUpload onFileSelect={()=>{}} isProcessing={true} />
           </div>
        )}
        
        {status === AppStatus.ERROR && (
           <div className="text-center pt-20">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
                <RefreshCw className="w-8 h-8 text-red-600" />
             </div>
             <h2 className="text-2xl font-bold text-slate-900 mb-2">Generation Failed</h2>
             <p className="text-slate-600 mb-6">Something went wrong while processing the PDF. Please try again.</p>
             <button onClick={handleReset} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
               Try Again
             </button>
           </div>
        )}

        {(status === AppStatus.QUIZ_READY || status === AppStatus.QUIZ_COMPLETED) && quizData && (
          <div className="space-y-8 animate-fade-in">
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
                    ${allQuestionsAnswered ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                  `}
                 >
                   Submit Quiz <ArrowRight className="ml-2 w-5 h-5" />
                 </button>
              </div>
            )}
            
            {status === AppStatus.QUIZ_COMPLETED && (
               <div className="flex justify-center pb-12">
                  <button onClick={handleReset} className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-lg hover:border-indigo-600 hover:text-indigo-600 transition-colors">
                     Upload Another Exam
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
