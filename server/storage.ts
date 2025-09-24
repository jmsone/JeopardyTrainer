import { 
  type Category, 
  type Question, 
  type UserProgress, 
  type SpacedRepetition,
  type LearningMaterial,
  type StudyMaterial,
  type TestAttempt,
  type InsertCategory,
  type InsertQuestion,
  type InsertUserProgress,
  type InsertSpacedRepetition,
  type InsertLearningMaterial,
  type InsertStudyMaterial,
  type InsertTestAttempt,
  type QuestionWithCategory,
  type QuestionWithLearning,
  type StudyReview,
  type CategoryStats,
  type DailyStats,
  type ReadinessScore
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
  clearProgress(): Promise<void>;
  resetGameBoard(): Promise<void>;
  
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
  
  // Learning Materials
  getLearningMaterial(questionId: string): Promise<LearningMaterial | undefined>;
  createLearningMaterial(material: InsertLearningMaterial): Promise<LearningMaterial>;
  getStudyReview(): Promise<StudyReview>;
  
  // Study Materials  
  getStudyMaterials(): Promise<StudyMaterial[]>;
  getStudyMaterialsByCategory(category: string): Promise<StudyMaterial[]>;
  createStudyMaterial(material: InsertStudyMaterial): Promise<StudyMaterial>;
  
  // Test Attempts
  createTestAttempt(attempt: InsertTestAttempt): Promise<TestAttempt>;
  getTestAttempts(mode?: "anytime_test"): Promise<TestAttempt[]>;
  getAnytimeTestSet(): Promise<QuestionWithCategory[]>;
  
  // Readiness Calculation
  getReadinessScore(): Promise<ReadinessScore>;
  
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
  private learningMaterials: Map<string, LearningMaterial> = new Map();
  private studyMaterials: Map<string, StudyMaterial> = new Map();
  private testAttempts: Map<string, TestAttempt> = new Map();

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
      const category: Category = { ...cat, id: randomUUID(), weight: cat.weight || 1.0 };
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
        { text: "This Olympic sport combines swimming, cycling, and running in succession.", answer: "What is triathlon?", value: 1000, difficulty: 5 },
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
        const question: Question = { 
          ...q, 
          categoryId: category.id, 
          id: randomUUID(),
          difficulty: q.difficulty || 1,
          airDate: q.airDate || null,
          jServiceId: q.jServiceId || null
        };
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
    const category: Category = { ...insertCategory, id, weight: insertCategory.weight || 1.0 };
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

  async clearProgress(): Promise<void> {
    this.userProgress.clear();
    this.spacedRepetition.clear();
  }

  async resetGameBoard(): Promise<void> {
    // Clear progress and regenerate questions with new data
    await this.clearProgress();
    
    // Clear existing questions and categories
    this.categories.clear();
    this.questions.clear();
    
    // Re-initialize with fresh data
    this.initializeData();
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = { 
      ...insertQuestion, 
      id,
      difficulty: insertQuestion.difficulty || 1,
      airDate: insertQuestion.airDate || null,
      jServiceId: insertQuestion.jServiceId || null
    };
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
      mode: insertProgress.mode || "game",
      sessionId: insertProgress.sessionId || null,
      answeredAt: new Date(),
      userAnswer: insertProgress.userAnswer || null,
      timeSpent: insertProgress.timeSpent || null,
      selfAssessment: insertProgress.selfAssessment || "unsure"
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
    const data: SpacedRepetition = { 
      ...insertData, 
      id,
      easeFactor: insertData.easeFactor ?? 2.5,
      interval: insertData.interval ?? 1,
      repetitions: insertData.repetitions ?? 0,
      nextReview: insertData.nextReview ?? new Date(),
      lastReviewed: insertData.lastReviewed ?? null
    };
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

  // Learning Materials implementation
  async getLearningMaterial(questionId: string): Promise<LearningMaterial | undefined> {
    return Array.from(this.learningMaterials.values()).find(lm => lm.questionId === questionId);
  }

  async createLearningMaterial(insertMaterial: InsertLearningMaterial): Promise<LearningMaterial> {
    const id = randomUUID();
    const material: LearningMaterial = { 
      ...insertMaterial, 
      id, 
      commonness: insertMaterial.commonness || "common",
      generatedAt: new Date() 
    };
    this.learningMaterials.set(id, material);
    return material;
  }

  async getStudyReview(): Promise<StudyReview> {
    const allProgress = await this.getUserProgress();
    const review: StudyReview = {
      correct: [],
      incorrect: [],
      unsure: []
    };

    for (const progress of allProgress) {
      const questionWithCategory = await this.getQuestion(progress.questionId);
      if (!questionWithCategory) continue;

      const learningMaterial = await this.getLearningMaterial(progress.questionId);
      const questionWithLearning: QuestionWithLearning = {
        ...questionWithCategory,
        learningMaterial
      };

      review[progress.selfAssessment].push(questionWithLearning);
    }

    return review;
  }

  // Study Materials implementation
  async getStudyMaterials(): Promise<StudyMaterial[]> {
    return Array.from(this.studyMaterials.values());
  }

  async getStudyMaterialsByCategory(category: string): Promise<StudyMaterial[]> {
    return Array.from(this.studyMaterials.values()).filter(sm => sm.category === category);
  }

  async createStudyMaterial(insertMaterial: InsertStudyMaterial): Promise<StudyMaterial> {
    const id = randomUUID();
    const material: StudyMaterial = { 
      ...insertMaterial, 
      id, 
      generatedAt: new Date()
    };
    this.studyMaterials.set(id, material);
    return material;
  }

  // Test Attempts implementation
  async createTestAttempt(insertAttempt: InsertTestAttempt): Promise<TestAttempt> {
    const id = randomUUID();
    const attempt: TestAttempt = {
      ...insertAttempt,
      id,
      finishedAt: new Date()
    };
    this.testAttempts.set(id, attempt);
    return attempt;
  }

  async getTestAttempts(mode?: "anytime_test"): Promise<TestAttempt[]> {
    const attempts = Array.from(this.testAttempts.values());
    if (mode) {
      return attempts.filter(attempt => attempt.mode === mode);
    }
    return attempts;
  }

  async getAnytimeTestSet(): Promise<QuestionWithCategory[]> {
    // Get 50 questions with diverse category coverage
    const categories = Array.from(this.categories.values());
    const questions: QuestionWithCategory[] = [];
    
    // Try to get one question per category first
    for (const category of categories) {
      const categoryQuestions = Array.from(this.questions.values())
        .filter(q => q.categoryId === category.id);
      
      if (categoryQuestions.length > 0) {
        const randomQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
        questions.push({
          ...randomQuestion,
          category
        });
      }
      
      if (questions.length >= 50) break;
    }
    
    // Fill remaining slots with random questions if needed
    while (questions.length < 50) {
      const allQuestions = Array.from(this.questions.values());
      const usedIds = new Set(questions.map(q => q.id));
      const availableQuestions = allQuestions.filter(q => !usedIds.has(q.id));
      
      if (availableQuestions.length === 0) break;
      
      const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      const category = this.categories.get(randomQuestion.categoryId);
      
      if (category) {
        questions.push({
          ...randomQuestion,
          category
        });
      }
    }
    
    return questions.slice(0, 50);
  }

  async getReadinessScore(): Promise<ReadinessScore> {
    const now = new Date();
    const allProgress = await this.getUserProgress();
    const testAttempts = await this.getTestAttempts("anytime_test");
    const spacedRepetitionData = await this.getSpacedRepetitionData();
    const categories = await this.getCategories();

    // Time decay function: w = exp(-ageDays/halfLife)
    const calculateTimeWeight = (date: Date, halfLifeDays: number): number => {
      const ageDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return Math.exp(-ageDays / halfLifeDays);
    };

    // Component 1: Anytime! Test Performance (60%)
    let anytimeTestScore = 0;
    if (testAttempts.length > 0) {
      const weightedAttempts = testAttempts.map(attempt => {
        const accuracy = (attempt.correctCount / attempt.totalQuestions) * 100;
        const weight = calculateTimeWeight(attempt.finishedAt, 21); // 21-day half-life
        return { accuracy, weight };
      });
      
      const totalWeight = weightedAttempts.reduce((sum, a) => sum + a.weight, 0);
      if (totalWeight > 0) {
        anytimeTestScore = weightedAttempts.reduce((sum, a) => sum + (a.accuracy * a.weight), 0) / totalWeight;
      }
    }

    // Component 2: Game Mode Performance (25%)
    const gameProgress = allProgress.filter(p => p.mode === "game");
    let gameModeScore = 0;
    if (gameProgress.length > 0) {
      const weightedGameProgress = gameProgress.map(progress => {
        const accuracy = progress.correct ? 100 : 0;
        const weight = calculateTimeWeight(progress.answeredAt, 28); // 28-day half-life
        return { accuracy, weight };
      });
      
      const totalWeight = weightedGameProgress.reduce((sum, p) => sum + p.weight, 0);
      if (totalWeight > 0) {
        gameModeScore = weightedGameProgress.reduce((sum, p) => sum + (p.accuracy * p.weight), 0) / totalWeight;
      }
    }

    // Component 3: Spaced Repetition Performance (15%)
    let spacedRepetitionScore = 0;
    if (spacedRepetitionData.length > 0) {
      // Calculate average ease factor and recent review performance
      const avgEaseFactor = spacedRepetitionData.reduce((sum, sr) => sum + sr.easeFactor, 0) / spacedRepetitionData.length;
      
      // Recent reviews (last 30 days)
      const recentReviews = allProgress.filter(p => {
        const daysDiff = (now.getTime() - p.answeredAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30;
      });
      
      const recentCorrectRate = recentReviews.length > 0 
        ? (recentReviews.filter(p => p.correct).length / recentReviews.length) * 100 
        : 0;
      
      // Map ease factor (baseline 2.5) to 0-100 scale and combine with recent performance
      const easeFactorScore = Math.max(0, Math.min(100, ((avgEaseFactor - 1.3) / 1.7) * 100));
      spacedRepetitionScore = Math.max(0, Math.min(100, easeFactorScore * (recentCorrectRate / 100)));
    }

    // Calculate category coverage and breadth
    const categoryCoverage: Array<{
      categoryId: string;
      categoryName: string;
      accuracy: number;
      recentQuestions: number;
      weight: number;
      covered: boolean;
    }> = [];

    for (const category of categories) {
      const categoryProgress = allProgress.filter(p => {
        const question = Array.from(this.questions.values()).find(q => q.id === p.questionId);
        return question?.categoryId === category.id;
      });

      // Recent questions (last 60 days)
      const recentProgress = categoryProgress.filter(p => {
        const daysDiff = (now.getTime() - p.answeredAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 60;
      });

      const accuracy = recentProgress.length > 0 
        ? (recentProgress.filter(p => p.correct).length / recentProgress.length) * 100 
        : 0;

      const covered = accuracy >= 70 && recentProgress.length >= 3;

      categoryCoverage.push({
        categoryId: category.id,
        categoryName: category.name,
        accuracy,
        recentQuestions: recentProgress.length,
        weight: category.weight,
        covered
      });
    }

    const coveredCategories = categoryCoverage.filter(c => c.covered).length;
    const breadthFactor = Math.min(1, coveredCategories / 10);

    // Calculate base score from components
    const components = [
      { name: "Anytime! Test", score: anytimeTestScore, weight: 0.6, description: "Practice test performance" },
      { name: "Game Mode", score: gameModeScore, weight: 0.25, description: "Traditional game performance" },
      { name: "Spaced Repetition", score: spacedRepetitionScore, weight: 0.15, description: "Knowledge retention" }
    ];

    const baseScore = components.reduce((sum, comp) => sum + (comp.score * comp.weight), 0);
    
    // Apply breadth factor: final = baseScore * (0.7 + 0.3 * breadthFactor)
    // If covered < 6 categories, cap readiness at 69%
    let overallScore = baseScore * (0.7 + 0.3 * breadthFactor);
    if (coveredCategories < 6) {
      overallScore = Math.min(overallScore, 69);
    }

    // Letter grade
    const letterGrade: "A" | "B" | "C" | "D" | "F" = 
      overallScore >= 90 ? "A" :
      overallScore >= 80 ? "B" :
      overallScore >= 70 ? "C" :
      overallScore >= 60 ? "D" : "F";

    // Test ready: ≥80% readiness and at least one passing test in last 30 days
    const recentPassingTests = testAttempts.filter(attempt => {
      const daysDiff = (now.getTime() - attempt.finishedAt.getTime()) / (1000 * 60 * 60 * 24);
      const accuracy = (attempt.correctCount / attempt.totalQuestions) * 100;
      return daysDiff <= 30 && accuracy >= 70;
    });

    const testReady = overallScore >= 80 && recentPassingTests.length > 0;

    // Identify weak categories (below 60% accuracy or insufficient recent questions)
    const weakCategories = categoryCoverage.filter(c => c.accuracy < 60 || c.recentQuestions < 3);

    return {
      overallScore: Math.round(overallScore * 10) / 10,
      letterGrade,
      components,
      categoryBreadth: {
        coveredCategories,
        totalCategories: categories.length,
        requiredCategories: 10,
        breadthFactor: Math.round(breadthFactor * 100) / 100
      },
      categoryCoverage,
      weakCategories,
      testReady,
      lastUpdated: now
    };
  }
}

export const storage = new MemStorage();
