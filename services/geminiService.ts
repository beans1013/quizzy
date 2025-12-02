import { GoogleGenAI, Type } from "@google/genai";
import { QuizData } from "../types";

const processFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateQuizFromPDF = async (file: File): Promise<QuizData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const base64Data = await processFileToBase64(file);

  // Using gemini-3-pro-preview for complex reasoning in Math/Chem
  const modelId = "gemini-3-pro-preview";

  const prompt = `
    You are an expert University Tutor in Mathematics and Chemistry. 
    Analyze the attached exam PDF deeply. 
    Create a Multiple Choice Quiz (MCQ) based on the key concepts, problems, and formulas found in the document.
    
    Requirements:
    1. Extract or synthesize 5 to 8 challenging questions. 
    2. For math/chem problems, ensure the answers are calculated precisely.
    3. IMPORTANT: You must generate 4 options for each question.
       - One option must be the correct answer.
       - The other three options must be "distractors": plausible but incorrect answers derived from common student mistakes (e.g., sign errors, wrong formula application, stoichiometry errors).
    4. Provide a clear, step-by-step explanation for the correct solution using LaTeX for formulas where appropriate.
    5. Format all math/chemical formulas in the question, options, and explanation using standard LaTeX enclosed in single dollar signs (e.g., $E=mc^2$).
    
    Return the response strictly as a JSON object matching the defined schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A suitable title for the quiz based on the PDF content",
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  text: { type: Type.STRING, description: "The question text, including LaTeX." },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Array of 4 options strings (including LaTeX)."
                  },
                  correctAnswerIndex: { 
                    type: Type.INTEGER, 
                    description: "The index (0-3) of the correct option." 
                  },
                  explanation: { 
                    type: Type.STRING,
                    description: "Detailed explanation of the solution."
                  }
                },
                required: ["id", "text", "options", "correctAnswerIndex", "explanation"],
              },
            },
          },
          required: ["title", "questions"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response received from Gemini.");
    }
    
    const data = JSON.parse(text) as QuizData;
    return data;

  } catch (error) {
    console.error("Quiz generation failed:", error);
    throw error;
  }
};
