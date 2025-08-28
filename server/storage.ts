import { 
  type Category, 
  type Question, 
  type UserProgress, 
  type SpacedRepetition,
  type InsertCategory,
  type InsertQuestion,
  type InsertUserProgress,
  type InsertSpacedRepetition,
  type QuestionWithCategory,
  type CategoryStats,
  type DailyStats
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Questions
  getQuestions(): Promise<Question[]>;
  getQuestionsByCategory(categoryId: string): Promise<Question[]>;
  getRandomQuestionsByCategory(categoryId: string, value: number): Promise<Question[]>;
  getQuestion(id: string): Promise<QuestionWithCategory | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionByValue(categoryId: string, value: number): Promise<QuestionWithCategory | undefined>;
  getRapidFireQuestions(limit?: number, categoryIds?: string[]): Promise<QuestionWithCategory[]>;
  getAnsweredQuestions(): Promise<{ questionId: string; assessment: "correct" | "incorrect" | "unsure" }[]>;
  
  // User Progress
  getUserProgress(): Promise<UserProgress[]>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  getUserProgressByCategory(categoryId: string): Promise<UserProgress[]>;
  
  // Spaced Repetition
  getSpacedRepetitionData(): Promise<SpacedRepetition[]>;
  getSpacedRepetitionForQuestion(questionId: string): Promise<SpacedRepetition | undefined>;
  createSpacedRepetition(data: InsertSpacedRepetition): Promise<SpacedRepetition>;
  updateSpacedRepetition(id: string, data: Partial<SpacedRepetition>): Promise<SpacedRepetition>;
  getQuestionsForReview(limit?: number): Promise<QuestionWithCategory[]>;
  
  // Statistics
  getCategoryStats(): Promise<CategoryStats[]>;
  getDailyStats(days: number): Promise<DailyStats[]>;
  getOverallStats(): Promise<{
    totalQuestions: number;
    overallAccuracy: number;
    currentStreak: number;
    totalStudyTime: number;
  }>;
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category> = new Map();
  private questions: Map<string, Question> = new Map();
  private userProgress: Map<string, UserProgress> = new Map();
  private spacedRepetition: Map<string, SpacedRepetition> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize with sample Jeopardy categories
    const sampleCategories: InsertCategory[] = [
      { name: "World History", weight: 2.0 },
      { name: "Science & Nature", weight: 1.8 },
      { name: "Literature", weight: 1.5 },
      { name: "Geography", weight: 1.7 },
      { name: "Sports", weight: 1.3 },
      { name: "Entertainment", weight: 1.4 },
    ];

    sampleCategories.forEach(cat => {
      const category: Category = { ...cat, id: randomUUID() };
      this.categories.set(category.id, category);
    });

    // Create questions for each category and dollar value
    const categoryArray = Array.from(this.categories.values());
    const values = [200, 400, 600, 800, 1000];
    
    const sampleQuestions: { [key: string]: Omit<InsertQuestion, 'categoryId'>[] } = {
      "World History": [
        { text: "This French emperor was exiled to the island of Elba in 1814, only to return for the famous 'Hundred Days' before his final defeat at Waterloo.", answer: "Who is Napoleon Bonaparte?", value: 200, difficulty: 1 },
        { text: "This ancient wonder of the world was a lighthouse built on the island of Pharos near Alexandria, Egypt.", answer: "What is the Lighthouse of Alexandria?", value: 400, difficulty: 2 },
        { text: "This 1066 battle saw William the Conqueror defeat King Harold II of England.", answer: "What is the Battle of Hastings?", value: 600, difficulty: 3 },
        { text: "This 1789-1799 period in France saw the overthrow of the monarchy and the rise of Napoleon.", answer: "What is the French Revolution?", value: 800, difficulty: 4 },
        { text: "This treaty signed in 1919 officially ended World War I between Germany and the Allied Powers.", answer: "What is the Treaty of Versailles?", value: 1000, difficulty: 5 },
      ],
      "Science & Nature": [
        { text: "This element has the chemical symbol Au and atomic number 79.", answer: "What is gold?", value: 200, difficulty: 1 },
        { text: "This planet is known as the 'Red Planet' due to iron oxide on its surface.", answer: "What is Mars?", value: 400, difficulty: 2 },
        { text: "This scientist developed the theory of evolution by natural selection.", answer: "Who is Charles Darwin?", value: 600, difficulty: 3 },
        { text: "This fundamental force is responsible for radioactive decay and nuclear fusion in stars.", answer: "What is the weak nuclear force?", value: 800, difficulty: 4 },
        { text: "This quantum mechanical principle states that you cannot know both the position and momentum of a particle precisely.", answer: "What is Heisenberg's Uncertainty Principle?", value: 1000, difficulty: 5 },
      ],
      "Literature": [
        { text: "This Shakespeare play features the characters Rosencrantz and Guildenstern.", answer: "What is Hamlet?", value: 200, difficulty: 1 },
        { text: "This author wrote 'Pride and Prejudice' and 'Sense and Sensibility'.", answer: "Who is Jane Austen?", value: 400, difficulty: 2 },
        { text: "This epic poem by Homer tells the story of Odysseus' journey home from the Trojan War.", answer: "What is The Odyssey?", value: 600, difficulty: 3 },
        { text: "This Russian author wrote 'War and Peace' and 'Anna Karenina'.", answer: "Who is Leo Tolstoy?", value: 800, difficulty: 4 },
        { text: "This James Joyce novel follows Leopold Bloom through a single day in Dublin.", answer: "What is Ulysses?", value: 1000, difficulty: 5 },
      ],
      "Geography": [
        { text: "This is the capital city of Australia.", answer: "What is Canberra?", value: 200, difficulty: 1 },
        { text: "This South American river is the longest in the world.", answer: "What is the Amazon River?", value: 400, difficulty: 2 },
        { text: "This mountain range separates Europe from Asia.", answer: "What are the Ural Mountains?", value: 600, difficulty: 3 },
        { text: "This African country is completely surrounded by South Africa.", answer: "What is Lesotho?", value: 800, difficulty: 4 },
        { text: "This is the deepest point on Earth's surface, located in the Pacific Ocean.", answer: "What is the Mariana Trench?", value: 1000, difficulty: 5 },
      ],
      "Sports": [
        { text: "This 1969 music festival took place on Max Yasgur's dairy farm in Bethel, New York.", answer: "What is Woodstock?", value: 200, difficulty: 1 },
        { text: "This tennis tournament is played on grass courts in London each summer.", answer: "What is Wimbledon?", value: 400, difficulty: 2 },
        { text: "This boxer was known as 'The Greatest' and 'The Louisville Lip'.", answer: "Who is Muhammad Ali?", value: 600, difficulty: 3 },
        { text: "This golfer has won the most major championships in history with 18 titles.", answer: "Who is Jack Nicklaus?", value: 800, difficulty: 4 },
        { text: "This baseball player holds the record for most career home runs with 755.", answer: "Who is Hank Aaron?", value: 1000, difficulty: 5 },
      ],
      "Entertainment": [
        { text: "This director created the 'Star Wars' saga.", answer: "Who is George Lucas?", value: 200, difficulty: 1 },
        { text: "This 1939 film starring Judy Garland features the song 'Over the Rainbow'.", answer: "What is The Wizard of Oz?", value: 400, difficulty: 2 },
        { text: "This Alfred Hitchcock film features the famous shower scene at the Bates Motel.", answer: "What is Psycho?", value: 600, difficulty: 3 },
        { text: "This composer wrote 'The Four Seasons' violin concertos.", answer: "Who is Antonio Vivaldi?", value: 800, difficulty: 4 },
        { text: "This opera by Puccini tells the story of an artist in Paris and features the aria 'O soave fanciulla'.", answer: "What is La Bohème?", value: 1000, difficulty: 5 },
      ],
    };

    categoryArray.forEach(category => {
      const questionsForCategory = sampleQuestions[category.name] || [];
      questionsForCategory.forEach(q => {
        const question: Question = { ...q, categoryId: category.id, id: randomUUID() };
        this.questions.set(question.id, question);
        
        // Initialize spaced repetition data for each question
        const srData: SpacedRepetition = {
          id: randomUUID(),
          questionId: question.id,
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          nextReview: new Date(),
          lastReviewed: null,
        };
        this.spacedRepetition.set(srData.id, srData);
      });
    });
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async getQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values());
  }

  async getQuestionsByCategory(categoryId: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(q => q.categoryId === categoryId);
  }

  async getRandomQuestionsByCategory(categoryId: string, value: number): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(q => q.categoryId === categoryId && q.value === value);
  }

  async getQuestionByValue(categoryId: string, value: number): Promise<QuestionWithCategory | undefined> {
    const question = Array.from(this.questions.values()).find(q => q.categoryId === categoryId && q.value === value);
    if (!question) return undefined;
    
    const category = this.categories.get(question.categoryId);
    if (!category) return undefined;
    
    return { ...question, category };
  }

  async getRapidFireQuestions(limit: number = 10, categoryIds?: string[]): Promise<QuestionWithCategory[]> {
    let allQuestions = Array.from(this.questions.values());
    
    // Filter by categories if specified
    if (categoryIds && categoryIds.length > 0) {
      allQuestions = allQuestions.filter(q => categoryIds.includes(q.categoryId));
    }
    
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const questionsWithCategories: QuestionWithCategory[] = [];
    
    for (const question of shuffled.slice(0, limit)) {
      const category = this.categories.get(question.categoryId);
      if (category) {
        questionsWithCategories.push({ ...question, category });
      }
    }
    
    return questionsWithCategories;
  }

  async getQuestion(id: string): Promise<QuestionWithCategory | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const category = this.categories.get(question.categoryId);
    if (!category) return undefined;
    
    return { ...question, category };
  }

  async getAnsweredQuestions(): Promise<{ questionId: string; assessment: "correct" | "incorrect" | "unsure" }[]> {
    return Array.from(this.userProgress.values()).map(p => ({ 
      questionId: p.questionId, 
      assessment: p.selfAssessment as "correct" | "incorrect" | "unsure"
    }));
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = { ...insertQuestion, id };
    this.questions.set(id, question);
    return question;
  }

  async getUserProgress(): Promise<UserProgress[]> {
    return Array.from(this.userProgress.values());
  }

  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const id = randomUUID();
    const progress: UserProgress = { 
      ...insertProgress, 
      id, 
      answeredAt: new Date() 
    };
    this.userProgress.set(id, progress);
    return progress;
  }

  async getUserProgressByCategory(categoryId: string): Promise<UserProgress[]> {
    const categoryQuestions = await this.getQuestionsByCategory(categoryId);
    const questionIds = new Set(categoryQuestions.map(q => q.id));
    
    return Array.from(this.userProgress.values()).filter(
      progress => questionIds.has(progress.questionId)
    );
  }

  async getSpacedRepetitionData(): Promise<SpacedRepetition[]> {
    return Array.from(this.spacedRepetition.values());
  }

  async getSpacedRepetitionForQuestion(questionId: string): Promise<SpacedRepetition | undefined> {
    return Array.from(this.spacedRepetition.values()).find(sr => sr.questionId === questionId);
  }

  async createSpacedRepetition(insertData: InsertSpacedRepetition): Promise<SpacedRepetition> {
    const id = randomUUID();
    const data: SpacedRepetition = { ...insertData, id };
    this.spacedRepetition.set(id, data);
    return data;
  }

  async updateSpacedRepetition(id: string, updates: Partial<SpacedRepetition>): Promise<SpacedRepetition> {
    const existing = this.spacedRepetition.get(id);
    if (!existing) throw new Error("Spaced repetition data not found");
    
    const updated: SpacedRepetition = { ...existing, ...updates };
    this.spacedRepetition.set(id, updated);
    return updated;
  }

  async getQuestionsForReview(limit: number = 10): Promise<QuestionWithCategory[]> {
    const now = new Date();
    const dueForReview = Array.from(this.spacedRepetition.values())
      .filter(sr => sr.nextReview <= now)
      .sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime())
      .slice(0, limit);

    const questionsWithCategories: QuestionWithCategory[] = [];
    
    for (const sr of dueForReview) {
      const questionWithCategory = await this.getQuestion(sr.questionId);
      if (questionWithCategory) {
        questionsWithCategories.push(questionWithCategory);
      }
    }
    
    return questionsWithCategories;
  }

  async getCategoryStats(): Promise<CategoryStats[]> {
    const categories = await this.getCategories();
    const stats: CategoryStats[] = [];

    for (const category of categories) {
      const categoryProgress = await this.getUserProgressByCategory(category.id);
      const totalQuestions = categoryProgress.length;
      const correctAnswers = categoryProgress.filter(p => p.correct).length;
      const averageTime = totalQuestions > 0 
        ? categoryProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0) / totalQuestions 
        : 0;

      stats.push({
        categoryId: category.id,
        categoryName: category.name,
        totalQuestions,
        correctAnswers,
        accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
        averageTime,
      });
    }

    return stats;
  }

  async getDailyStats(days: number): Promise<DailyStats[]> {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const allProgress = await this.getUserProgress();
    const dailyStats: DailyStats[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayProgress = allProgress.filter(p => {
        const progressDate = p.answeredAt.toISOString().split('T')[0];
        return progressDate === dateStr;
      });

      const questionsAnswered = dayProgress.length;
      const correctAnswers = dayProgress.filter(p => p.correct).length;
      const studyTime = dayProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

      dailyStats.push({
        date: dateStr,
        questionsAnswered,
        correctAnswers,
        accuracy: questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0,
        studyTime,
      });
    }

    return dailyStats;
  }

  async getOverallStats(): Promise<{
    totalQuestions: number;
    overallAccuracy: number;
    currentStreak: number;
    totalStudyTime: number;
  }> {
    const allProgress = await this.getUserProgress();
    const totalQuestions = allProgress.length;
    const correctAnswers = allProgress.filter(p => p.correct).length;
    const overallAccuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const totalStudyTime = Math.round(allProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0) / 3600); // hours

    // Calculate current streak
    const sortedProgress = allProgress
      .sort((a, b) => b.answeredAt.getTime() - a.answeredAt.getTime());
    
    let currentStreak = 0;
    for (const progress of sortedProgress) {
      if (progress.correct) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalQuestions,
      overallAccuracy,
      currentStreak,
      totalStudyTime,
    };
  }
}

export const storage = new MemStorage();
