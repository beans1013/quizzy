import React from 'react';
import { Question } from '../types';
import MathRenderer from './MathRenderer';
import { CheckCircle2, XCircle, Circle } from 'lucide-react';

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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-slate-800">Question {question.id}</h3>
        {showResult && (
          <div className="flex items-center">
            {selectedOptionIndex === question.correctAnswerIndex ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Correct
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center">
                <XCircle className="w-4 h-4 mr-1" /> Incorrect
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mb-6 text-slate-700 text-lg">
        <MathRenderer content={question.text} />
      </div>

      <div className="space-y-3">
        {question.options.map((option, index) => {
          let optionStyle = "border-slate-200 hover:border-indigo-300 hover:bg-slate-50";
          let icon = <Circle className="w-5 h-5 text-slate-400" />;
          
          if (showResult) {
            if (index === question.correctAnswerIndex) {
              optionStyle = "border-green-500 bg-green-50";
              icon = <CheckCircle2 className="w-5 h-5 text-green-600" />;
            } else if (index === selectedOptionIndex && index !== question.correctAnswerIndex) {
              optionStyle = "border-red-500 bg-red-50";
              icon = <XCircle className="w-5 h-5 text-red-600" />;
            } else {
              optionStyle = "border-slate-100 opacity-60";
            }
          } else if (selectedOptionIndex === index) {
            optionStyle = "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600";
            icon = <div className="w-5 h-5 rounded-full border-[5px] border-indigo-600" />;
          }

          return (
            <button
              key={index}
              onClick={() => !showResult && onSelectOption(index)}
              disabled={showResult}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-start gap-4 ${optionStyle}`}
            >
              <div className="mt-1 flex-shrink-0">{icon}</div>
              <div className="flex-grow">
                <MathRenderer content={option} className="text-slate-800" />
              </div>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in-up">
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Explanation</h4>
          <div className="bg-indigo-50 rounded-lg p-4 text-slate-800">
             <MathRenderer content={question.explanation} />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizCard;
