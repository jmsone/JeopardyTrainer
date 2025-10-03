// Integration service for Open Trivia Database API
// Note: This is NOT authentic Jeopardy data, but general trivia questions

interface OpenTDBQuestion {
  category: string;
  type: "multiple" | "boolean";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface OpenTDBResponse {
  response_code: number;
  results: OpenTDBQuestion[];
}

export class OpenTDBClient {
  private baseUrl = 'https://opentdb.com/api.php';
  
  async getRandomQuestions(count: number = 30): Promise<OpenTDBQuestion[]> {
    try {
      // Open Trivia DB limits to 50 questions per call
      const actualCount = Math.min(count, 50);
      const response = await fetch(`${this.baseUrl}?amount=${actualCount}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data: OpenTDBResponse = await response.json();
      
      if (data.response_code !== 0) {
        throw new Error(`API Error: Code ${data.response_code}`);
      }
      
      return data.results;
    } catch (error) {
      console.error('Failed to fetch questions from Open Trivia DB:', error);
      throw error;
    }
  }

  async getQuestionsByCategory(categoryId: number, count: number = 10): Promise<OpenTDBQuestion[]> {
    try {
      const actualCount = Math.min(count, 50);
      const response = await fetch(`${this.baseUrl}?amount=${actualCount}&category=${categoryId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data: OpenTDBResponse = await response.json();
      
      if (data.response_code !== 0) {
        throw new Error(`API Error: Code ${data.response_code}`);
      }
      
      return data.results;
    } catch (error) {
      console.error(`Failed to fetch questions for category ${categoryId}:`, error);
      throw error;
    }
  }

  // Convert difficulty to dollar value (Jeopardy-style)
  getDollarValue(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 200;
      case 'medium': return 600;
      case 'hard': return 1000;
      default: return 400;
    }
  }

  // Decode HTML entities in questions/answers
  decodeHTML(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'",
      '&ldquo;': '"',
      '&rdquo;': '"',
      '&lsquo;': "'",
      '&rsquo;': "'",
      '&ndash;': '–',
      '&mdash;': '—',
    };
    
    return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
  }

  // Convert Open Trivia DB question to our internal format
  convertQuestion(question: OpenTDBQuestion): {
    text: string;
    answer: string;
    value: number;
    difficulty: number;
    category: string;
  } {
    const dollarValue = this.getDollarValue(question.difficulty);
    
    return {
      text: this.decodeHTML(question.question),
      answer: this.decodeHTML(question.correct_answer),
      value: dollarValue,
      difficulty: Math.ceil(dollarValue / 200),
      category: this.decodeHTML(question.category)
    };
  }
}

export const openTDBClient = new OpenTDBClient();
