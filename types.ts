export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  QUIZ_READY = 'QUIZ_READY',
  QUIZ_COMPLETED = 'QUIZ_COMPLETED',
  ERROR = 'ERROR'
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizData {
  title: string;
  questions: Question[];
}

export interface QuizResult {
  score: number;
  total: number;
  answers: Record<number, number>; // questionId -> selectedOptionIndex
}
