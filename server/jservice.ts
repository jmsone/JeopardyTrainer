// Integration service for jService API - authentic Jeopardy data
interface JServiceCategory {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  clues_count: number;
}

interface JServiceClue {
  id: number;
  answer: string;
  question: string;
  value: number | null;
  airdate: string;
  created_at: string;
  updated_at: string;
  category_id: number;
  game_id: number;
  invalid_count: number | null;
  category: {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
    clues_count: number;
  };
}

interface JServiceRandomClues {
  id: number;
  answer: string;
  question: string;
  value: number | null;
  airdate: string;
  created_at: string;
  updated_at: string;
  category_id: number;
  game_id: number;
  invalid_count: number | null;
  category: {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
    clues_count: number;
  };
}

export class JServiceClient {
  private baseUrl = 'https://jservice.io/api';

  async getRandomCategories(count: number = 6): Promise<JServiceCategory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories?count=${count}&offset=${Math.floor(Math.random() * 100)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch categories from jService:', error);
      throw error;
    }
  }

  async getCluesForCategory(categoryId: number, count: number = 10): Promise<JServiceClue[]> {
    try {
      const response = await fetch(`${this.baseUrl}/clues?category=${categoryId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const clues = await response.json();
      
      // Filter out invalid clues and return up to count items
      return clues
        .filter((clue: JServiceClue) => 
          clue.question && 
          clue.answer && 
          clue.value && 
          clue.value > 0 &&
          !clue.question.includes('audio') &&
          !clue.question.includes('video') &&
          !clue.question.includes('seen here') &&
          !clue.question.includes('this image')
        )
        .slice(0, count);
    } catch (error) {
      console.error(`Failed to fetch clues for category ${categoryId}:`, error);
      throw error;
    }
  }

  async getRandomClues(count: number = 30): Promise<JServiceRandomClues[]> {
    try {
      const response = await fetch(`${this.baseUrl}/random?count=${count}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const clues = await response.json();
      
      // Filter out invalid clues
      return clues.filter((clue: JServiceRandomClues) => 
        clue.question && 
        clue.answer && 
        clue.value && 
        clue.value > 0 &&
        !clue.question.includes('audio') &&
        !clue.question.includes('video') &&
        !clue.question.includes('seen here') &&
        !clue.question.includes('this image')
      );
    } catch (error) {
      console.error('Failed to fetch random clues from jService:', error);
      throw error;
    }
  }

  async searchClues(query: string, count: number = 10): Promise<JServiceClue[]> {
    try {
      const response = await fetch(`${this.baseUrl}/clues?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const clues = await response.json();
      
      return clues
        .filter((clue: JServiceClue) => 
          clue.question && 
          clue.answer && 
          clue.value && 
          clue.value > 0
        )
        .slice(0, count);
    } catch (error) {
      console.error(`Failed to search clues for "${query}":`, error);
      throw error;
    }
  }

  // Convert jService data to our internal format
  convertCategory(jCategory: JServiceCategory): { name: string; weight: number } {
    return {
      name: jCategory.title,
      weight: 1.0
    };
  }

  convertClue(jClue: JServiceClue | JServiceRandomClues): {
    text: string;
    answer: string;
    value: number;
    difficulty: number;
    airDate: string;
    jServiceId: number;
  } {
    return {
      text: jClue.question,
      answer: jClue.answer,
      value: jClue.value || 200,
      difficulty: Math.ceil((jClue.value || 200) / 200),
      airDate: jClue.airdate,
      jServiceId: jClue.id
    };
  }
}

export const jServiceClient = new JServiceClient();