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
  getQuestion(id: string): Promise<QuestionWithCategory | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  
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

    // Initialize with sample questions
    const sampleQuestions: Omit<InsertQuestion, 'categoryId'>[] = [
      { text: "This French emperor was exiled to the island of Elba in 1814, only to return for the famous 'Hundred Days' before his final defeat at Waterloo.", answer: "Who is Napoleon Bonaparte?", value: 600, difficulty: 3 },
      { text: "This ancient wonder of the world was a lighthouse built on the island of Pharos near Alexandria, Egypt.", answer: "What is the Lighthouse of Alexandria?", value: 400, difficulty: 2 },
      { text: "This 1969 music festival took place on Max Yasgur's dairy farm in Bethel, New York.", answer: "What is Woodstock?", value: 200, difficulty: 1 },
      { text: "This element has the chemical symbol Au and atomic number 79.", answer: "What is gold?", value: 400, difficulty: 2 },
      { text: "This Shakespeare play features the characters Rosencrantz and Guildenstern.", answer: "What is Hamlet?", value: 800, difficulty: 4 },
    ];

    const categoryArray = Array.from(this.categories.values());
    sampleQuestions.forEach((q, index) => {
      const categoryId = categoryArray[index % categoryArray.length].id;
      const question: Question = { ...q, categoryId, id: randomUUID() };
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

  async getQuestion(id: string): Promise<QuestionWithCategory | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    
    const category = this.categories.get(question.categoryId);
    if (!category) return undefined;
    
    return { ...question, category };
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
