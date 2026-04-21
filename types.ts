export type GameType = 'hora' | 'por-para' | 'cuando-cuanto' | 'poco-unpoco';

export interface Question {
  id: number;
  question: string;
  options: string[];
  correct: string;
  translation: string;
  explanation: string;
  visual?: string; // For the clock face or other visuals
}

export interface GameData {
  title: string;
  description: string;
  questions: Question[];
}
