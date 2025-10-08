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
  private lastRequestTime = 0;
  private minRequestInterval = 5000; // Open Trivia DB: 1 request per 5 seconds
  
  // Retry logic with exponential backoff for rate limiting
  private async fetchWithRetry<T>(
    fetchFn: () => Promise<T>, 
    maxRetries: number = 3,
    baseDelay: number = 2000
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Rate limiting: wait if needed
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
          const waitTime = this.minRequestInterval - timeSinceLastRequest;
          console.log(`⏱️  Rate limiting: waiting ${waitTime}ms before request`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
        const result = await fetchFn();
        
        if (attempt > 0) {
          console.log(`✅ Request succeeded after ${attempt} retries`);
        }
        
        return result;
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries;
        const isRateLimited = error.message?.includes('429') || error.message?.includes('500');
        
        if (isLastAttempt || !isRateLimited) {
          throw error;
        }
        
        // Exponential backoff: 2s, 4s, 8s
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`⚠️  Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retries exceeded');
  }
  
  async getRandomQuestions(count: number = 30): Promise<OpenTDBQuestion[]> {
    return this.fetchWithRetry(async () => {
      // Open Trivia DB limits to 50 questions per call
      const actualCount = Math.min(count, 50);
      // Only get multiple choice questions (exclude true/false)
      const response = await fetch(`${this.baseUrl}?amount=${actualCount}&type=multiple`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data: OpenTDBResponse = await response.json();
      
      if (data.response_code !== 0) {
        throw new Error(`API Error: Code ${data.response_code}`);
      }
      
      // Filter out questions with problematic phrasing for Jeopardy format
      const filtered = data.results.filter(q => this.isJeopardySuitable(q.question));
      
      return filtered;
    });
  }

  async getQuestionsByCategory(categoryId: number, count: number = 10): Promise<OpenTDBQuestion[]> {
    return this.fetchWithRetry(async () => {
      // Request more questions since we'll filter some out
      const actualCount = Math.min(count * 2, 50);
      // Only get multiple choice questions (exclude true/false)
      const response = await fetch(`${this.baseUrl}?amount=${actualCount}&category=${categoryId}&type=multiple`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data: OpenTDBResponse = await response.json();
      
      if (data.response_code !== 0) {
        throw new Error(`API Error: Code ${data.response_code}`);
      }
      
      // Filter out questions with problematic phrasing for Jeopardy format
      const filtered = data.results.filter(q => this.isJeopardySuitable(q.question));
      
      // Return requested count
      return filtered.slice(0, count);
    });
  }

  // Check if question is suitable for Jeopardy format (doesn't require seeing multiple choice options)
  private isJeopardySuitable(question: string): boolean {
    const problematicPhrases = [
      'which of the following',
      'which one of the following',
      'all of the following except',
      'which of these',
      'select all that apply',
      'which statement is',
      'which answer',
    ];
    
    const lowerQuestion = question.toLowerCase();
    return !problematicPhrases.some(phrase => lowerQuestion.includes(phrase));
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
    
    // Decode entities multiple times to handle double-encoding
    let decoded = text;
    let prevDecoded = '';
    while (decoded !== prevDecoded) {
      prevDecoded = decoded;
      decoded = decoded.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
    }
    
    return decoded;
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
