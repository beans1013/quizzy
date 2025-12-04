import { QuizData } from "../types";

export const PROMPT_TEMPLATE = `You are an expert University Tutor in Mathematics and Chemistry.
Analyze the content provided by the user.
Create a Multiple Choice Quiz (MCQ) based on the key concepts, problems, and formulas.

Requirements:
1. Generate 5 to 8 challenging questions.
2. For math/chem problems, ensure answers are calculated precisely.
3. Generate 4 options for each question:
   - One option must be the correct answer.
   - The other three options must be "distractors": plausible but incorrect answers.
4. Provide a clear, step-by-step explanation for the correct solution.
5. Format all math/chemical formulas in the question, options, and explanation using standard LaTeX enclosed in single dollar signs (e.g., $E=mc^2$).

IMPORTANT: Return the response strictly as a raw JSON object with the following structure:

{
  "title": "Quiz Title",
  "questions": [
    {
      "id": 1,
      "text": "Question text including LaTeX...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Detailed explanation..."
    }
  ]
}`;

const cleanAndParse = (text: string): QuizData => {
    // Remove markdown code blocks if the AI added them (e.g. ```json ... ```)
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(cleanedText);
    
    // Basic schema validation
    if (!json.title || !Array.isArray(json.questions)) {
      throw new Error("Invalid JSON structure: Missing 'title' or 'questions' array.");
    }
    
    // Validate first question structure lightly
    if (json.questions.length > 0) {
        const q = json.questions[0];
        if (!q.text || !Array.isArray(q.options) || typeof q.correctAnswerIndex !== 'number') {
            throw new Error("Invalid Question structure in JSON.");
        }
    }
    return json as QuizData;
};

export const parseQuizString = (text: string): QuizData => {
    try {
        return cleanAndParse(text);
    } catch (error) {
        console.error("JSON Parse Error:", error);
        throw new Error("Failed to parse JSON text. Please ensure it is valid JSON matching the template.");
    }
}

export const parseQuizJSON = (file: File): Promise<QuizData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = cleanAndParse(text);
        resolve(data);
      } catch (error) {
        console.error("JSON Parse Error:", error);
        reject(new Error("Failed to parse JSON file. Please ensure the file contains valid JSON matching the template."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
};