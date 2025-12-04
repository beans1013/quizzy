import React from 'react';
import { Question } from '../types';
import MathRenderer from './MathRenderer';
import { Check, X, Circle, Square } from 'lucide-react';

interface QuizCardProps {
  question: Question;
  selectedOptionIndex?: number;
  onSelectOption: (optionIndex: number) => void;
  showResult: boolean;
}

const QuizCard: React.FC<QuizCardProps> = ({ 
  question, 
  selectedOptionIndex, 
  onSelectOption, 
  showResult 
}) => {
  return (
    <div className="relative bg-zinc-900 border border-zinc-700 p-6 mb-8 group hover:border-zinc-500 transition-colors">
      {/* Decorative Label */}
      <div className="absolute -top-3 left-4 bg-zinc-900 px-2 text-xs font-mono text-zinc-500 border border-zinc-700">
        Q_ID::{String(question.id).padStart(3, '0')}
      </div>

      <div className="flex justify-between items-start mb-6 mt-2">
        <h3 className="text-xl font-bold text-white uppercase tracking-tight">
           <span className="text-yellow-400 mr-2">/</span>Question {question.id}
        </h3>
        {showResult && (
          <div className="flex items-center font-mono text-sm tracking-wider uppercase">
            {selectedOptionIndex === question.correctAnswerIndex ? (
              <span className="px-3 py-1 bg-green-900/30 text-green-400 border border-green-500 flex items-center shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                <Check className="w-4 h-4 mr-2" /> CORRECT
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-900/30 text-red-500 border border-red-500 flex items-center shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <X className="w-4 h-4 mr-2" /> ERROR
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mb-8 text-zinc-300 text-lg leading-relaxed">
        <MathRenderer content={question.text} />
      </div>

      <div className="space-y-4">
        {question.options.map((option, index) => {
          let optionStyle = "border-zinc-700 text-zinc-400 hover:border-yellow-400 hover:text-white hover:bg-zinc-800";
          let icon = <Square className="w-4 h-4 text-zinc-600" />;
          
          if (showResult) {
            if (index === question.correctAnswerIndex) {
              optionStyle = "border-green-500 bg-green-900/10 text-green-400";
              icon = <Check className="w-4 h-4 text-green-400" />;
            } else if (index === selectedOptionIndex && index !== question.correctAnswerIndex) {
              optionStyle = "border-red-500 bg-red-900/10 text-red-500";
              icon = <X className="w-4 h-4 text-red-500" />;
            } else {
              optionStyle = "border-zinc-800 text-zinc-600 opacity-50";
            }
          } else if (selectedOptionIndex === index) {
            optionStyle = "border-yellow-400 bg-yellow-400/10 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.15)]";
            icon = <div className="w-4 h-4 bg-yellow-400" />;
          }

          return (
            <button
              key={index}
              onClick={() => !showResult && onSelectOption(index)}
              disabled={showResult}
              className={`w-full text-left p-4 border-2 transition-all duration-200 flex items-start gap-4 ${optionStyle}`}
            >
              <div className="mt-1 flex-shrink-0 font-mono text-xs opacity-70">
                 {String.fromCharCode(65 + index)} //
              </div>
              <div className="flex-grow">
                <MathRenderer content={option} className={showResult && index === question.correctAnswerIndex ? "text-green-400" : ""} />
              </div>
              <div className="mt-1 flex-shrink-0">{icon}</div>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="mt-8 pt-6 border-t border-zinc-800 animate-fade-in relative">
           <div className="absolute top-0 left-0 w-8 h-[1px] bg-yellow-400"></div>
          <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest mb-3">Analysis // Explanation</h4>
          <div className="bg-zinc-950/50 border-l-2 border-cyan-400 p-4 text-zinc-300">
             <MathRenderer content={question.explanation} />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizCard;